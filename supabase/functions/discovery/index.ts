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

// Israeli deal RSS feeds
const RSS_FEEDS = [
  { url: 'https://www.walla.co.il/rss/deals', name: 'Walla Deals' },
  { url: 'https://www.ynet.co.il/rss/shopping', name: 'Ynet Shopping' },
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

async function fetchRss(feedUrl: string): Promise<{ title: string; link: string; description: string; guid: string }[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'MySellGuid/1.0', 'Accept-Language': 'he,en' },
      signal: createTimeout(10000),
    });
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
    const res = await fetch(`https://t.me/s/${username}`, {
      headers: { 'User-Agent': 'MySellGuid/1.0' },
      signal: createTimeout(10000),
    });
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

async function autoPublishSale(supabase: any, sale: any, sourceUrl: string, sourceType: string) {
  // Find or create "Discovered Sales" store
  let { data: store } = await supabase.from('stores').select('*').eq('name', 'Discovered Sales').single();

  if (!store) {
    const { data: newStore } = await supabase.from('stores').insert({
      name: 'Discovered Sales',
      description: 'Sales discovered automatically from deal sites and social media',
      address: 'Various Locations',
      city: 'Israel',
      country: 'Israel',
      category: 'other',
      latitude: 32.0853,
      longitude: 34.7818,
      location: 'SRID=4326;POINT(34.7818 32.0853)',
      isVerified: false,
    }).select().single();
    store = newStore;
  }

  if (!store) return null;

  const { data: created } = await supabase.from('sales').insert({
    title: sale.title || 'Discovered Sale',
    description: sale.description || '',
    storeId: store.id,
    category: sale.category || 'other',
    discountPercentage: sale.discountPercentage,
    originalPrice: sale.originalPrice,
    salePrice: sale.salePrice,
    currency: 'ILS',
    latitude: store.latitude,
    longitude: store.longitude,
    location: `SRID=4326;POINT(${store.longitude} ${store.latitude})`,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    source: 'auto_discovered',
    sourceUrl,
    sourceType,
    autoDiscovered: true,
    aiMetadata: { confidence: sale.confidence, processingDate: new Date().toISOString() },
  }).select().single();

  return created;
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
      const supabase = createClient(supabaseUrl, supabaseKey);

      const results = {
        rssItems: 0,
        telegramItems: 0,
        analyzed: 0,
        published: 0,
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

      // Analyze top candidates with Gemini (limit to 5 per run to control costs)
      const toAnalyze = candidates.slice(0, 5);
      for (const candidate of toAnalyze) {
        if (!GEMINI_API_KEY) break;
        try {
          const extracted = await analyzeWithGemini(candidate.text, candidate.source);
          results.analyzed++;

          if (extracted.confidence >= 0.75) {
            // Auto-publish high-confidence sales
            const published = await autoPublishSale(supabase, extracted, candidate.sourceUrl || '', candidate.source);
            if (published) results.published++;
          } else if (extracted.confidence >= 0.4) {
            results.pending++;
          }
        } catch (e) {
          results.errors.push(`Analysis error: ${e.message}`);
        }
      }

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
