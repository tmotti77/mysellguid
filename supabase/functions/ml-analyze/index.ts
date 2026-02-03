import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY')!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SALE_EXTRACTION_PROMPT = `Analyze this content and extract sale/discount information.
Return ONLY valid JSON with this structure:
{
  "title": "short catchy title for the sale",
  "description": "brief description of what's on sale",
  "discountPercentage": number or null,
  "originalPrice": number or null,
  "salePrice": number or null,
  "category": "clothing|shoes|electronics|home_goods|beauty|sports|food|other",
  "products": ["list", "of", "specific", "products"],
  "storeName": "store/brand name if visible",
  "storeAddress": "address if mentioned",
  "expiryDate": "ISO date string if expiry mentioned, or null",
  "confidence": 0.0 to 1.0 (how confident you are this is a valid sale)
}
If this doesn't appear to be a sale/discount, return {"confidence": 0}.
Support Hebrew text - translate descriptions to English but keep store names in original language.`;

async function callGemini(parts: any[]): Promise<any> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  return response.json();
}

function parseGeminiResponse(data: any): any {
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return { ...JSON.parse(jsonMatch[0]), rawText: text };
      } catch {
        return { confidence: 0, rawText: text };
      }
    }
  }
  return { confidence: 0, rawText: JSON.stringify(data) };
}

// Analyze a base64-encoded screenshot/image
async function analyzeScreenshot(base64Data: string, mimeType: string): Promise<any> {
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const data = await callGemini([
    { text: SALE_EXTRACTION_PROMPT },
    { inlineData: { mimeType, data: base64Clean } },
  ]);
  return parseGeminiResponse(data);
}

// Analyze image from a public URL
async function analyzeImageUrl(imageUrl: string): Promise<any> {
  // Fetch image and convert to base64
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

  return analyzeScreenshot(base64Image, mimeType);
}

// Extract relevant content from HTML (OG tags, meta, body text)
function extractHtmlContent(html: string): string {
  const extracted: string[] = [];

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) extracted.push(`Title: ${titleMatch[1]}`);

  const ogTags = ['og:title', 'og:description', 'og:image', 'og:site_name'];
  ogTags.forEach(tag => {
    const match = html.match(new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["']([^"']+)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${tag}["']`, 'i'));
    if (match) extracted.push(`${tag}: ${match[1]}`);
  });

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) extracted.push(`Description: ${descMatch[1]}`);

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);
    extracted.push(`Body: ${bodyContent}`);
  }

  return extracted.join('\n\n') || html.substring(0, 3000);
}

// Extract sale info from a URL (Instagram, TikTok, etc.)
async function extractFromUrl(url: string): Promise<any> {
  const platform = detectPlatform(url);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
    },
    redirect: 'follow',
  });

  const html = await response.text();
  const content = extractHtmlContent(html);

  const prompt = `Analyze this ${platform} post content and extract sale/discount information.
Return ONLY valid JSON:
{
  "title": "catchy short title",
  "description": "description of the sale",
  "discountPercentage": number or null,
  "originalPrice": number or null,
  "salePrice": number or null,
  "category": "clothing|shoes|electronics|home_goods|beauty|sports|food|other",
  "products": ["list"],
  "storeName": "store/brand name",
  "storeAddress": "address if mentioned",
  "expiryDate": "ISO date if mentioned",
  "imageUrls": ["extracted image urls"],
  "profileName": "profile/account name",
  "confidence": 0.0 to 1.0
}
If not a sale, return {"confidence": 0}.
Handle Hebrew - translate descriptions to English but keep store names in original.

Page content from ${url}:
${content}`;

  const data = await callGemini([{ text: prompt }]);
  const result = parseGeminiResponse(data);
  return { ...result, sourceUrl: url, sourcePlatform: platform };
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('instagram') || u.includes('instagr.am')) return 'instagram';
  if (u.includes('tiktok')) return 'tiktok';
  if (u.includes('facebook') || u.includes('fb.com')) return 'facebook';
  if (u.includes('twitter') || u.includes('x.com')) return 'twitter';
  if (u.includes('t.me') || u.includes('telegram')) return 'telegram';
  if (u.includes('wa.me') || u.includes('whatsapp')) return 'whatsapp';
  return 'web';
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'POST required. Body: { action: "screenshot"|"image"|"url", ... }' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_GEMINI_API_KEY secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    let result: any;

    switch (body.action) {
      case 'screenshot':
        if (!body.base64Data) throw new Error('base64Data is required');
        result = await analyzeScreenshot(body.base64Data, body.mimeType || 'image/jpeg');
        break;

      case 'image':
        if (!body.imageUrl) throw new Error('imageUrl is required');
        result = await analyzeImageUrl(body.imageUrl);
        break;

      case 'url':
        if (!body.url) throw new Error('url is required');
        result = await extractFromUrl(body.url);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: screenshot, image, or url' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ML analyze error:', error);
    return new Response(
      JSON.stringify({ error: error.message, confidence: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
