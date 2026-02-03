import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');

function createTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// Deal RSS feeds (Israeli sites block server-side fetches; using global deal feeds as fallback)
const RSS_FEEDS = [
  { url: 'https://deals.slashdot.org/rss', name: 'Slashdot Deals' },
  { url: 'https://www.dealnews.com/rss/', name: 'DealNews' },
];

// Israeli Telegram deal channels (public preview scraping)
const TELEGRAM_CHANNELS = ['DealsIL', 'MivtzaimIsrael', 'KuponimIL'];

const SALE_KEYWORDS = [
  'מבצע', 'הנחה', 'סייל', 'sale', 'discount', '%', 'off',
  'חינם', 'free', '1+1', 'קנה', 'buy', 'save', 'חסכו',
  '₪', 'שקל', 'מחיר', 'price', 'deal', 'דיל', 'קופון', 'coupon',
];

function looksLikeSale(text: string): boolean {
  const lower = text.toLowerCase();
  return SALE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// Regex-based extraction fallback — works without Gemini for basic price/discount parsing
function extractSaleFromText(text: string, title: string): any {
  const discountMatch = text.match(/(\d+)\s*%\s*(?:off|discount|הנחה)/i);
  const discountPercentage = discountMatch ? parseInt(discountMatch[1]) : null;

  // Price patterns: require $ or ₪ prefix to avoid matching dates/random numbers
  const priceMatches = text.match(/[\$₪]\s*[\d][\d,.]+/g) || [];
  const prices = priceMatches
    .map(p => parseFloat(p.replace(/[$₪,\s]/g, '')))
    .filter(p => p > 0.99 && p < 100000);

  let originalPrice: number | null = null;
  let salePrice: number | null = null;
  if (prices.length >= 2) {
    originalPrice = Math.max(...prices);
    salePrice = Math.min(...prices);
  } else if (prices.length === 1 && discountPercentage) {
    salePrice = prices[0];
    originalPrice = Math.round(salePrice / (1 - discountPercentage / 100));
  }

  // Category from keywords — order matters: specific before general
  let category = 'other';
  const lowerText = text.toLowerCase();
  if (/shoe|sneaker|boot|footwear/.test(lowerText)) category = 'shoes';
  else if (/fitness|gym|workout|training|exercise/.test(lowerText)) category = 'sports';
  else if (/beauty|skin|hair|cosmetic/.test(lowerText)) category = 'beauty';
  else if (/food|meal|restaurant|pizza|grocery/.test(lowerText)) category = 'food';
  else if (/laptop|phone|tablet|computer|software|electronic|gaming/.test(lowerText)) category = 'electronics';
  else if (/cloth|shirt|dress|jacket|fashion|apparel/.test(lowerText)) category = 'clothing';
  else if (/home|furniture|kitchen|decor/.test(lowerText)) category = 'home_goods';

  const confidence = discountPercentage && (originalPrice || salePrice) ? 0.7 : discountPercentage ? 0.45 : 0;

  return {
    title: title.slice(0, 120),
    description: text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300),
    discountPercentage,
    originalPrice,
    salePrice,
    category,
    confidence,
  };
}

function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function parseRssXml(xml: string): { title: string; link: string; description: string; guid: string }[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const title = extractXmlTag(match[1], 'title');
    if (title) {
      items.push({
        title,
        link: extractXmlTag(match[1], 'link'),
        description: extractXmlTag(match[1], 'description'),
        guid: extractXmlTag(match[1], 'guid'),
      });
    }
  }
  return items.slice(0, 20);
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'he,en-US,en',
};

async function fetchRss(feedUrl: string): Promise<{ title: string; link: string; description: string; guid: string }[]> {
  try {
    const res = await fetch(feedUrl, { headers: FETCH_HEADERS, signal: createTimeout(10000) });
    if (!res.ok) return [];
    return parseRssXml(await res.text());
  } catch {
    return [];
  }
}

function parseTelegramMessages(html: string): { id: string; text: string }[] {
  const messages: { id: string; text: string }[] = [];
  const textRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const idRegex = /data-post="([^"]+)"/g;
  const ids: string[] = [];
  let idMatch;
  while ((idMatch = idRegex.exec(html)) !== null) ids.push(idMatch[1]);

  let match;
  let i = 0;
  while ((match = textRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 15) messages.push({ id: ids[i] || `msg_${i}`, text });
    i++;
  }
  return messages.slice(0, 20);
}

async function fetchTelegram(username: string): Promise<{ id: string; text: string }[]> {
  try {
    const res = await fetch(`https://t.me/s/${username}`, { headers: FETCH_HEADERS, signal: createTimeout(10000) });
    if (!res.ok) return [];
    return parseTelegramMessages(await res.text());
  } catch {
    return [];
  }
}

async function analyzeWithGemini(content: string, source: string): Promise<any> {
  if (!GEMINI_API_KEY) return { confidence: 0, error: 'GOOGLE_GEMINI_API_KEY not set' };

  const prompt = 'Analyze this ' + source + ' content and extract sale/discount information from Israel.\n' +
    'Return ONLY valid JSON with keys: title, description, discountPercentage, originalPrice, salePrice, ' +
    'category (clothing|shoes|electronics|home_goods|beauty|sports|food|other), storeName, confidence (0.0-1.0).\n' +
    'If not a sale, return confidence 0. Keep store names in Hebrew if that is how they appear.\n\n' +
    'Content:\n' + content;

  const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY;
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  const data = await response.json();
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
    }
  }
  return { confidence: 0 };
}

const publishErrors: string[] = [];

async function autoPublishSale(supabase: any, sale: any, sourceUrl: string, sourceType: string) {
  try {
    // Find or create "Discovered Sales" store — use maybeSingle() to avoid throwing on no rows
    const { data: existingStore } = await supabase.from('stores').select('*').eq('name', 'Discovered Sales').maybeSingle();
    let store = existingStore;

    if (!store) {
      const { data: users } = await supabase.from('users').select('id').limit(1);
      const ownerId = users?.[0]?.id;
      if (!ownerId) { publishErrors.push('No users found for ownerId'); return null; }

      const { data: created, error: storeErr } = await supabase.from('stores').insert({
        id: crypto.randomUUID(),
        name: 'Discovered Sales',
        description: 'Auto-discovered deals',
        address: 'Various Locations',
        city: 'Israel',
        country: 'Israel',
        category: 'other',
        latitude: 32.0853,
        longitude: 34.7818,
        location: 'SRID=4326;POINT(34.7818 32.0853)',
        ownerId,
        isVerified: false,
        isActive: true,
        totalSales: 0,
        views: 0,
        rating: 0,
        reviewCount: 0,
      }).select().single();

      if (storeErr) { publishErrors.push('Store create error: ' + storeErr.message); return null; }
      store = created;
    }

    // Deduplicate — skip if we already published this sourceUrl
    if (sourceUrl) {
      const { data: existing } = await supabase.from('sales').select('id').eq('sourceUrl', sourceUrl).maybeSingle();
      if (existing) return 'deduped';
    }

    const now = new Date().toISOString();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: createdSale, error: saleErr } = await supabase.from('sales').insert({
      id: crypto.randomUUID(),
      title: (sale.title || 'Discovered Sale').slice(0, 120),
      description: (sale.description || '').slice(0, 1000),
      storeId: store.id,
      category: sale.category || 'other',
      discountPercentage: sale.discountPercentage || null,
      originalPrice: sale.originalPrice || null,
      salePrice: sale.salePrice || null,
      currency: 'USD',
      startDate: now,
      endDate,
      status: 'active',
      images: '',
      latitude: store.latitude,
      longitude: store.longitude,
      location: `SRID=4326;POINT(${store.longitude} ${store.latitude})`,
      source: 'auto_discovered',
      sourceUrl: sourceUrl || '',
      sourceType,
      autoDiscovered: true,
      aiMetadata: { confidence: sale.confidence, processingDate: now },
      views: 0,
      clicks: 0,
      shares: 0,
      saves: 0,
      createdAt: now,
      updatedAt: now,
    }).select().single();

    if (saleErr) { publishErrors.push('Sale insert error: ' + saleErr.message); return null; }
    return createdSale;
  } catch (e) {
    publishErrors.push('autoPublish exception: ' + e.message);
    return null;
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'stats';

    // GET /discovery?action=stats — return current state
    if (action === 'stats') {
      return new Response(JSON.stringify({
        enabled: !!GEMINI_API_KEY,
        sources: {
          rss: RSS_FEEDS.map(f => f.name),
          telegram: TELEGRAM_CHANNELS,
        },
        autoPublishThreshold: 0.75,
        schedule: 'On-demand (call with action=run)',
        geminiConfigured: !!GEMINI_API_KEY,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /discovery?action=run — trigger a discovery cycle
    if (action === 'run' && req.method === 'POST') {
      publishErrors.length = 0;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const results = {
        rssItems: 0,
        telegramItems: 0,
        analyzed: 0,
        published: 0,
        skipped: 0,
        pending: 0,
        errors: [] as string[],
      };

      // Collect candidates from all sources
      const candidates: { source: string; sourceUrl?: string; text: string }[] = [];

      // Fetch RSS feeds
      for (const feed of RSS_FEEDS) {
        try {
          const items = await fetchRss(feed.url);
          for (const item of items) {
            const content = `${item.title}\n${item.description || ''}`;
            if (looksLikeSale(content)) {
              candidates.push({ source: 'rss', sourceUrl: item.link, text: content });
              results.rssItems++;
            }
          }
        } catch (e) {
          results.errors.push(`RSS ${feed.name}: ${e.message}`);
        }
      }

      // Fetch Telegram channels
      for (const channel of TELEGRAM_CHANNELS) {
        try {
          const messages = await fetchTelegram(channel);
          for (const msg of messages) {
            if (looksLikeSale(msg.text)) {
              candidates.push({ source: 'telegram', sourceUrl: `https://t.me/${channel}/${msg.id}`, text: msg.text });
              results.telegramItems++;
            }
          }
        } catch (e) {
          results.errors.push(`Telegram ${channel}: ${e.message}`);
        }
      }

      // Analyze top candidates (limit to 5 per run)
      const toAnalyze = candidates.slice(0, 5);
      for (const candidate of toAnalyze) {
        try {
          // Try Gemini; fall back to regex if unavailable or API fails
          let extracted = { confidence: 0 };
          if (GEMINI_API_KEY) {
            extracted = await analyzeWithGemini(candidate.text, candidate.source);
          }
          if (extracted.confidence === 0) {
            extracted = extractSaleFromText(candidate.text, candidate.text.split('\n')[0] || 'Discovered Sale');
          }
          results.analyzed++;

          if (extracted.confidence >= 0.75) {
            const result = await autoPublishSale(supabase, extracted, candidate.sourceUrl || '', candidate.source);
            if (result === 'deduped') results.skipped++;
            else if (result) results.published++;
          } else if (extracted.confidence >= 0.4) {
            if (extracted.discountPercentage && (extracted.originalPrice || extracted.salePrice)) {
              const result = await autoPublishSale(supabase, extracted, candidate.sourceUrl || '', candidate.source);
              if (result === 'deduped') { results.skipped++; continue; }
              if (result) { results.published++; continue; }
            }
            results.pending++;
          }
        } catch (e) {
          results.errors.push(`Analysis error: ${e.message}`);
        }
      }

      if (!GEMINI_API_KEY) {
        results.errors.push('Gemini not available — using regex extraction. Enable Generative Language API on GCP project to unlock AI analysis.');
      }

      if (publishErrors.length) results.errors.push(...publishErrors);

      return new Response(JSON.stringify({ ok: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Use action=stats (GET) or action=run (POST)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Discovery error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
