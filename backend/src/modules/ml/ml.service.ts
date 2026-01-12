import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SaleAnalysisResult {
  title?: string;
  description?: string;
  discountPercentage?: number;
  originalPrice?: number;
  salePrice?: number;
  category?: string;
  products?: string[];
  storeName?: string;
  storeAddress?: string;
  expiryDate?: string;
  confidence: number;
  rawText?: string;
  sourceUrl?: string;
  sourcePlatform?: string;
}

export interface UrlExtractionResult extends SaleAnalysisResult {
  imageUrls?: string[];
  profileName?: string;
  postDate?: string;
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private aiProvider: 'gemini' | 'openai';

  constructor(private configService: ConfigService) {
    this.aiProvider = this.configService.get('AI_PROVIDER', 'gemini') as 'gemini' | 'openai';
  }

  async analyzeImage(imageUrl: string): Promise<SaleAnalysisResult> {
    const provider = this.aiProvider;

    try {
      if (provider === 'gemini') {
        return await this.analyzeWithGemini(imageUrl);
      } else {
        return await this.analyzeWithOpenAI(imageUrl);
      }
    } catch (error) {
      this.logger.error(`Image analysis failed with ${provider}:`, error);
      return {
        confidence: 0,
        rawText: `Analysis failed: ${error.message}`,
      };
    }
  }

  private async analyzeWithGemini(imageUrl: string): Promise<SaleAnalysisResult> {
    const apiKey = this.configService.get('GOOGLE_GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GOOGLE_GEMINI_API_KEY not configured');
      return { confidence: 0, rawText: 'Gemini API key not configured' };
    }

    try {
      // Fetch image and convert to base64
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this sale/discount image and extract the following information in JSON format:
{
  "title": "short title for the sale",
  "description": "brief description",
  "discountPercentage": number or null,
  "originalPrice": number or null,
  "salePrice": number or null,
  "category": "one of: clothing, shoes, electronics, home_goods, beauty, sports, food, other",
  "products": ["list", "of", "products"],
  "storeName": "store name if visible",
  "confidence": 0.0 to 1.0
}
Only respond with valid JSON, no other text.`,
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...parsed,
            rawText: text,
          };
        }
      }

      return { confidence: 0, rawText: JSON.stringify(data) };
    } catch (error) {
      this.logger.error('Gemini analysis error:', error);
      throw error;
    }
  }

  private async analyzeWithOpenAI(imageUrl: string): Promise<SaleAnalysisResult> {
    const apiKey = this.configService.get('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured');
      return { confidence: 0, rawText: 'OpenAI API key not configured' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this sale/discount image and extract information in JSON format:
{
  "title": "short title",
  "description": "brief description",
  "discountPercentage": number or null,
  "originalPrice": number or null,
  "salePrice": number or null,
  "category": "clothing|shoes|electronics|home_goods|beauty|sports|food|other",
  "products": ["list"],
  "storeName": "if visible",
  "confidence": 0.0 to 1.0
}
Only respond with valid JSON.`,
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        const text = data.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { ...parsed, rawText: text };
        }
      }

      return { confidence: 0, rawText: JSON.stringify(data) };
    } catch (error) {
      this.logger.error('OpenAI analysis error:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.configService.get('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured for embeddings');
      return new Array(1536).fill(0);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });

      const data = await response.json();
      return data.data?.[0]?.embedding || new Array(1536).fill(0);
    } catch (error) {
      this.logger.error('Embedding generation error:', error);
      return new Array(1536).fill(0);
    }
  }

  async getRecommendations(userId: string, userPreferences: unknown) {
    // TODO: Implement pgvector similarity search
    return {
      message: 'Recommendations feature coming soon',
      userId,
      preferences: userPreferences,
    };
  }

  /**
   * Extract sale information from a social media URL
   * Supports: Instagram, TikTok, Facebook, Twitter/X, Telegram
   */
  async extractFromUrl(url: string): Promise<UrlExtractionResult> {
    const platform = this.detectPlatform(url);
    this.logger.log(`Extracting sale info from ${platform}: ${url}`);

    try {
      // Fetch the page content
      const pageContent = await this.fetchPageContent(url);

      // Use AI to extract sale information from the page content
      return await this.analyzePageContent(pageContent, url, platform);
    } catch (error) {
      this.logger.error(`URL extraction failed for ${url}:`, error);
      return {
        confidence: 0,
        sourceUrl: url,
        sourcePlatform: platform,
        rawText: `Extraction failed: ${error.message}`,
      };
    }
  }

  /**
   * Analyze a base64-encoded image (for screenshot uploads)
   */
  async analyzeBase64Image(base64Data: string, mimeType: string = 'image/jpeg'): Promise<SaleAnalysisResult> {
    const apiKey = this.configService.get('GOOGLE_GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GOOGLE_GEMINI_API_KEY not configured');
      return { confidence: 0, rawText: 'Gemini API key not configured' };
    }

    try {
      // Remove data URL prefix if present
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this screenshot of a sale/discount post (likely from Instagram, TikTok, or a messaging app).
Extract the following information and return ONLY valid JSON:
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

If this doesn't appear to be a sale/discount, return {"confidence": 0, "rawText": "Not a sale post"}.
Support Hebrew text - translate to English for the response but keep store names in original language.`,
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Clean,
                    },
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { ...parsed, rawText: text };
        }
      }

      return { confidence: 0, rawText: JSON.stringify(data) };
    } catch (error) {
      this.logger.error('Base64 image analysis error:', error);
      throw error;
    }
  }

  private detectPlatform(url: string): string {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) return 'instagram';
    if (urlLower.includes('tiktok.com') || urlLower.includes('vm.tiktok')) return 'tiktok';
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.com') || urlLower.includes('fb.watch')) return 'facebook';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
    if (urlLower.includes('t.me') || urlLower.includes('telegram')) return 'telegram';
    if (urlLower.includes('wa.me') || urlLower.includes('whatsapp')) return 'whatsapp';
    return 'unknown';
  }

  private async fetchPageContent(url: string): Promise<string> {
    try {
      // Use a simple fetch with mobile user agent for better content extraction
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
        },
        redirect: 'follow',
      });

      const html = await response.text();

      // Extract relevant content from HTML (meta tags, og tags, etc.)
      return this.extractRelevantContent(html, url);
    } catch (error) {
      this.logger.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  private extractRelevantContent(html: string, url: string): string {
    // Extract Open Graph and meta tags which usually contain the best content
    const extracted: string[] = [];

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) extracted.push(`Title: ${titleMatch[1]}`);

    // OG tags
    const ogTags = ['og:title', 'og:description', 'og:image', 'og:site_name'];
    ogTags.forEach(tag => {
      const match = html.match(new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${tag}["']`, 'i'));
      if (match) extracted.push(`${tag}: ${match[1]}`);
    });

    // Twitter cards
    const twitterTags = ['twitter:title', 'twitter:description', 'twitter:image'];
    twitterTags.forEach(tag => {
      const match = html.match(new RegExp(`<meta[^>]*name=["']${tag}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${tag}["']`, 'i'));
      if (match) extracted.push(`${tag}: ${match[1]}`);
    });

    // Description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) extracted.push(`Description: ${descMatch[1]}`);

    // JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        extracted.push(`Structured Data: ${JSON.stringify(jsonLd).substring(0, 1000)}`);
      } catch (e) {
        // Invalid JSON-LD, ignore
      }
    }

    // Try to extract visible text content (simplified)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      // Remove scripts and styles
      let bodyContent = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 2000);
      extracted.push(`Body Content: ${bodyContent}`);
    }

    return extracted.join('\n\n') || html.substring(0, 3000);
  }

  private async analyzePageContent(content: string, url: string, platform: string): Promise<UrlExtractionResult> {
    const apiKey = this.configService.get('GOOGLE_GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GOOGLE_GEMINI_API_KEY not configured');
      return { confidence: 0, sourceUrl: url, sourcePlatform: platform, rawText: 'Gemini API key not configured' };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this ${platform} post content and extract sale/discount information.
Return ONLY valid JSON with this structure:
{
  "title": "catchy short title for the sale",
  "description": "description of the sale/discount",
  "discountPercentage": number or null,
  "originalPrice": number or null,
  "salePrice": number or null,
  "category": "clothing|shoes|electronics|home_goods|beauty|sports|food|other",
  "products": ["list", "of", "products"],
  "storeName": "store/brand name",
  "storeAddress": "address if mentioned",
  "expiryDate": "ISO date if mentioned",
  "imageUrls": ["extracted", "image", "urls"],
  "profileName": "profile/account name",
  "confidence": 0.0 to 1.0
}

If this doesn't appear to be a sale/discount post, return {"confidence": 0}.
Handle Hebrew text - translate descriptions to English but keep store names in original.

Page content from ${url}:
${content}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...parsed,
            sourceUrl: url,
            sourcePlatform: platform,
            rawText: text,
          };
        }
      }

      return { confidence: 0, sourceUrl: url, sourcePlatform: platform, rawText: JSON.stringify(data) };
    } catch (error) {
      this.logger.error('Page content analysis error:', error);
      throw error;
    }
  }
}
