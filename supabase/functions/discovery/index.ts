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

/* ─── Sources ─── */

const RSS_FEEDS = [
  { url: 'https://deals.slashdot.org/rss', name: 'Slashdot Deals' },
  { url: 'https://www.dealnews.com/rss/', name: 'DealNews' },
];

const TELEGRAM_CHANNELS = [
  'DealsIL', 'MivtzaimIsrael', 'KuponimIL',
  'SaveMoneyIsrael', 'DealHunterIsrael', 'CouponsIsrael',
  'FlashDealsIL', 'ShopperIsrael', 'BestDealsIsrael',
  'MivtzaimDaily', 'DealFlashIL', 'IsraeliDeals',
];

const WEB_SCRAPE_URLS = [
  { url: 'https://www.tziim.com', name: 'Tziim' },
  { url: 'https://deal.co.il', name: 'Deal.co.il' },
];

/* ─── Israeli city geocoding ─── */

const ISRAELI_CITIES: Record<string, { lat: number; lng: number }> = {
  // Hebrew
  'תל אביב': { lat: 32.0853, lng: 34.7818 },
  'ירושלים': { lat: 31.7683, lng: 35.2137 },
  'חיפה': { lat: 32.7940, lng: 34.9818 },
  'בראר שבע': { lat: 31.2457, lng: 34.7913 },
  'נתניה': { lat: 32.3337, lng: 34.8892 },
  'הרצליה': { lat: 32.1775, lng: 34.9096 },
  'רמת גן': { lat: 32.0889, lng: 34.8506 },
  'פתח תקוה': { lat: 32.1167, lng: 34.8867 },
  'כפר סבא': { lat: 32.1795, lng: 34.9233 },
  'לוד': { lat: 31.9630, lng: 34.7710 },
  'רמלה': { lat: 31.9224, lng: 34.8724 },
  'בני ברק': { lat: 32.0783, lng: 34.8361 },
  'בת ים': { lat: 32.0117, lng: 34.7778 },
  'נס ציונה': { lat: 31.9217, lng: 34.9056 },
  'חולון': { lat: 31.9561, lng: 34.7778 },
  'רחובות': { lat: 31.8939, lng: 34.8944 },
  'רמת השרון': { lat: 32.1317, lng: 34.8553 },
  'אלעד': { lat: 32.0533, lng: 34.8611 },
  // English
  'tel aviv': { lat: 32.0853, lng: 34.7818 },
  'jerusalem': { lat: 31.7683, lng: 35.2137 },
  'haifa': { lat: 32.7940, lng: 34.9818 },
  'beer sheva': { lat: 31.2457, lng: 34.7913 },
  'beersheva': { lat: 31.2457, lng: 34.7913 },
  'netanya': { lat: 32.3337, lng: 34.8892 },
  'herzliya': { lat: 32.1775, lng: 34.9096 },
  'herzelia': { lat: 32.1775, lng: 34.9096 },
  'ramat gan': { lat: 32.0889, lng: 34.8506 },
  'petah tikva': { lat: 32.1167, lng: 34.8867 },
  'kfar sava': { lat: 32.1795, lng: 34.9233 },
  'lod': { lat: 31.9630, lng: 34.7710 },
  'ramle': { lat: 31.9224, lng: 34.8724 },
  'bnei brak': { lat: 32.0783, lng: 34.8361 },
  'bat yam': { lat: 32.0117, lng: 34.7778 },
  'ness ziona': { lat: 31.9217, lng: 34.9056 },
  'holon': { lat: 31.9561, lng: 34.7778 },
  'rehovot': { lat: 31.8939, lng: 34.8944 },
  'ramat hasharon': { lat: 32.1317, lng: 34.8553 },
};

// Major cities used as deterministic fallback when no city name found in text
const FALLBACK_LOCATIONS = [
  { lat: 32.0853, lng: 34.7818 }, // Tel Aviv
  { lat: 31.7683, lng: 35.2137 }, // Jerusalem
  { lat: 32.7940, lng: 34.9818 }, // Haifa
  { lat: 32.3337, lng: 34.8892 }, // Netanya
  { lat: 31.2457, lng: 34.7913 }, // Beer Sheva
  { lat: 32.1775, lng: 34.9096 }, // Herzliya
  { lat: 32.0889, lng: 34.8506 }, // Ramat Gan
  { lat: 31.8939, lng: 34.8944 }, // Rehovot
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Extract city from text → coordinates. Falls back to deterministic hash of sourceUrl across major cities.
function resolveLocation(text: string, sourceUrl: string): { lat: number; lng: number } {
  const lower = text.toLowerCase();
  // Sort by length DESC so "ramat gan" matches before "gan"
  const sorted = Object.keys(ISRAELI_CITIES).sort((a, b) => b.length - a.length);
  for (const city of sorted) {
    if (lower.includes(city.toLowerCase())) return ISRAELI_CITIES[city];
  }
  return FALLBACK_LOCATIONS[hashCode(sourceUrl) % FALLBACK_LOCATIONS.length];
}

/* ─── Keywords & extraction ─── */

const SALE_KEYWORDS = [
  'מבצע', 'הנחה', 'סייל', 'sale', 'discount', '%', 'off',
  'חינם', 'free', '1+1', 'קנה', 'buy', 'save', 'חסכו',
  '₪', 'שקל', 'שקלים', 'ש"כ', 'מחיר', 'price', 'deal', 'דיל',
  'קופון', 'coupon', 'חיסכון', 'savings', 'מבצע עד',
];

function looksLikeSale(text: string): boolean {
  const lower = text.toLowerCase();
  return SALE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

function extractSaleFromText(text: string, title: string): any {
  // Discount: "X% off", "הנחה של X%", bare "X%" as last resort
  let discountPercentage: number | null = null;
  const discountPatterns = [
    /(\d+)\s*%\s*(?:off|discount|הנחה|חיסכון)/i,
    /(?:הנחה|discount|חיסכון)\s*(?:של|of)?\s*(\d+)\s*%/i,
  ];
  for (const pat of discountPatterns) {
    const m = text.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val > 0 && val < 100) { discountPercentage = val; break; }
    }
  }
  if (!discountPercentage) {
    const bare = text.match(/(\d+)\s*%/);
    if (bare) {
      const val = parseInt(bare[1]);
      if (val >= 5 && val < 100) discountPercentage = val;
    }
  }

  // Prices: ₪X, $X, X ש"כ, X שקל, X שקלים, X NIS, X ILS
  const priceRegex = /(?:[\$₪]\s*([\d][\d,.]*)|(?:([\d][\d,.]*))\s*(?:ש"כ|שקל|שקלים|NIS|ILS|₪|\$))/g;
  const prices: number[] = [];
  let pm;
  while ((pm = priceRegex.exec(text)) !== null) {
    const val = parseFloat((pm[1] || pm[2]).replace(/,/g, ''));
    if (val > 0.99 && val < 100000) prices.push(val);
  }

  let originalPrice: number | null = null;
  let salePrice: number | null = null;
  if (prices.length >= 2) {
    originalPrice = Math.max(...prices);
    salePrice = Math.min(...prices);
  } else if (prices.length === 1 && discountPercentage) {
    salePrice = prices[0];
    originalPrice = Math.round(salePrice / (1 - discountPercentage / 100));
  } else if (prices.length === 1) {
    salePrice = prices[0];
  }

  // Category (Hebrew + English keywords)
  let category = 'other';
  const lt = text.toLowerCase();
  if (/shoe|sneaker|boot|footwear|נעל|נעלי/.test(lt)) category = 'shoes';
  else if (/fitness|gym|workout|training|כושר|גופני/.test(lt)) category = 'sports';
  else if (/beauty|skin|hair|cosmetic|יופי|שפתיים/.test(lt)) category = 'beauty';
  else if (/food|meal|restaurant|pizza|grocery|אוכל|מסעדה|פיצה|שופרסל|רמי לוי/.test(lt)) category = 'food';
  else if (/laptop|phone|tablet|computer|electronic|gaming|מחשב|טלפון|אלקטרונ/.test(lt)) category = 'electronics';
  else if (/cloth|shirt|dress|jacket|fashion|apparel|בגד|חולצ|שמלה|אופנ/.test(lt)) category = 'clothing';
  else if (/home|furniture|kitchen|decor|בית|מטבח/.test(lt)) category = 'home_goods';

  // Confidence tiers
  let confidence = 0;
  if (discountPercentage && originalPrice && salePrice) confidence = 0.8;
  else if (discountPercentage && (originalPrice || salePrice)) confidence = 0.7;
  else if (discountPercentage) confidence = 0.5;
  else if (originalPrice && salePrice) confidence = 0.6;
  else if (salePrice || originalPrice) confidence = 0.35;

  return {
    title: title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120),
    description: text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400),
    discountPercentage,
    originalPrice,
    salePrice,
    category,
    confidence,
  };
}

/* ─── Fetchers ─── */

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'he,en-US,en',
};

function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function parseRssXml(xml: string): { title: string; link: string; description: string }[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const title = extractXmlTag(match[1], 'title');
    if (title) items.push({ title, link: extractXmlTag(match[1], 'link'), description: extractXmlTag(match[1], 'description') });
  }
  return items.slice(0, 20);
}

async function fetchRss(feedUrl: string): Promise<{ title: string; link: string; description: string }[]> {
  try {
    const res = await fetch(feedUrl, { headers: FETCH_HEADERS, signal: createTimeout(10000) });
    if (!res.ok) return [];
    return parseRssXml(await res.text());
  } catch { return []; }
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
  return messages.slice(0, 30);
}

async function fetchTelegram(username: string): Promise<{ id: string; text: string }[]> {
  try {
    const res = await fetch(`https://t.me/s/${username}`, { headers: FETCH_HEADERS, signal: createTimeout(10000) });
    if (!res.ok) return [];
    return parseTelegramMessages(await res.text());
  } catch { return []; }
}

// Generic web page scraper — extracts deal/product card text blocks
async function fetchWebDeals(pageUrl: string): Promise<{ text: string; link: string }[]> {
  try {
    const res = await fetch(pageUrl, { headers: FETCH_HEADERS, signal: createTimeout(10000) });
    if (!res.ok) return [];
    const html = await res.text();
    const deals: { text: string; link: string }[] = [];

    // Strategy 1: elements with deal/product class names
    const cardRegex = /<(?:div|article|li)[^>]*(?:class|id)="[^"]*(?:deal|card|product|item|offer|coupon)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 20 && text.length < 2000) {
        const linkMatch = match[1].match(/href="([^"]+)"/);
        let link = pageUrl;
        if (linkMatch) { try { link = new URL(linkMatch[1], pageUrl).href; } catch { /* keep default */ } }
        deals.push({ text, link });
      }
    }

    // Strategy 2: paragraphs / headings that contain sale keywords
    if (deals.length === 0) {
      const blockRegex = /<(?:p|h[2-4]|li)[^>]*>([\s\S]{20,500}?)<\/(?:p|h[2-4]|li)>/gi;
      while ((match = blockRegex.exec(html)) !== null) {
        const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.length > 25 && looksLikeSale(text)) deals.push({ text, link: pageUrl });
      }
    }
    return deals.slice(0, 30);
  } catch { return []; }
}

/* ─── Gemini ─── */

async function analyzeWithGemini(content: string, source: string): Promise<any> {
  if (!GEMINI_API_KEY) return { confidence: 0 };
  try {
    const prompt =
      'Analyze this ' + source + ' content and extract sale/discount info.\n' +
      'Return ONLY valid JSON: {"title","description","discountPercentage","originalPrice","salePrice",' +
      '"category" (clothing|shoes|electronics|home_goods|beauty|sports|food|other),"storeName","confidence" (0-1)}.\n' +
      'If not a sale return {"confidence":0}. Keep Hebrew text as-is.\n\nContent:\n' + content;

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch { /* fall through */ }
  return { confidence: 0 };
}

/* ─── Store helper ─── */

async function getOrCreateDiscoveredStore(supabase: any): Promise<any> {
  const { data: existing } = await supabase.from('stores').select('*').eq('name', 'Discovered Sales').maybeSingle();
  if (existing) return existing;

  const { data: users } = await supabase.from('users').select('id').limit(1);
  const ownerId = users?.[0]?.id;
  if (!ownerId) return null;

  const { data: created } = await supabase.from('stores').insert({
    id: crypto.randomUUID(),
    name: 'Discovered Sales',
    description: 'Auto-discovered deals from Israeli sources',
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

  return created;
}

/* ─── Publish ─── */

async function publishSale(
  supabase: any,
  store: any,
  sale: any,
  sourceUrl: string,
  sourceType: string,
  location: { lat: number; lng: number }
): Promise<'published' | 'deduped' | null> {
  // Deduplicate by sourceUrl
  if (sourceUrl) {
    const { data: existing } = await supabase.from('sales').select('id').eq('sourceUrl', sourceUrl).maybeSingle();
    if (existing) return 'deduped';
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase.from('sales').insert({
    id: crypto.randomUUID(),
    title: (sale.title || 'Discovered Sale').slice(0, 120),
    description: (sale.description || '').slice(0, 1000),
    storeId: store.id,
    category: sale.category || 'other',
    discountPercentage: sale.discountPercentage || null,
    originalPrice: sale.originalPrice || null,
    salePrice: sale.salePrice || null,
    currency: 'ILS',
    startDate: now,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    images: '',
    latitude: location.lat,
    longitude: location.lng,
    location: `SRID=4326;POINT(${location.lng} ${location.lat})`,
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

  return error ? null : 'published';
}

/* ─── Main handler ─── */

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'stats';

    // GET /discovery?action=stats
    if (action === 'stats') {
      return new Response(JSON.stringify({
        enabled: true,
        sources: {
          rss: RSS_FEEDS.map(f => f.name),
          telegram: TELEGRAM_CHANNELS,
          web: WEB_SCRAPE_URLS.map(s => s.name),
        },
        autoPublishThreshold: 0.4,
        schedule: 'Every 2 hours via pg_cron',
        geminiConfigured: !!GEMINI_API_KEY,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /discovery?action=run
    if (action === 'run' && req.method === 'POST') {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const results = {
        rssItems: 0,
        telegramItems: 0,
        webItems: 0,
        analyzed: 0,
        published: 0,
        skipped: 0,
        pending: 0,
        errors: [] as string[],
      };

      const store = await getOrCreateDiscoveredStore(supabase);
      if (!store) {
        results.errors.push('Failed to get/create Discovered Sales store');
        return new Response(JSON.stringify({ ok: false, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const candidates: { source: string; sourceUrl: string; text: string }[] = [];

      // 1. RSS feeds
      for (const feed of RSS_FEEDS) {
        try {
          for (const item of await fetchRss(feed.url)) {
            const content = `${item.title}\n${item.description || ''}`;
            if (looksLikeSale(content)) {
              candidates.push({ source: 'rss', sourceUrl: item.link, text: content });
              results.rssItems++;
            }
          }
        } catch (e) { results.errors.push(`RSS ${feed.name}: ${e.message}`); }
      }

      // 2. Telegram channels (fetched in parallel)
      const telegramResults = await Promise.allSettled(
        TELEGRAM_CHANNELS.map(ch => fetchTelegram(ch).then(msgs => ({ channel: ch, msgs })))
      );
      for (const result of telegramResults) {
        if (result.status === 'fulfilled') {
          const { channel, msgs } = result.value;
          for (const msg of msgs) {
            if (looksLikeSale(msg.text)) {
              candidates.push({ source: 'telegram', sourceUrl: `https://t.me/${channel}/${msg.id}`, text: msg.text });
              results.telegramItems++;
            }
          }
        }
      }

      // 3. Web scraping
      for (const site of WEB_SCRAPE_URLS) {
        try {
          for (const deal of await fetchWebDeals(site.url)) {
            if (looksLikeSale(deal.text)) {
              candidates.push({ source: 'web', sourceUrl: deal.link, text: deal.text });
              results.webItems++;
            }
          }
        } catch (e) { results.errors.push(`Web ${site.name}: ${e.message}`); }
      }

      // Analyze up to 40 candidates
      for (const candidate of candidates.slice(0, 40)) {
        try {
          let extracted: any = { confidence: 0 };
          if (GEMINI_API_KEY) {
            extracted = await analyzeWithGemini(candidate.text, candidate.source);
          }
          if (!extracted.confidence || extracted.confidence === 0) {
            extracted = extractSaleFromText(candidate.text, candidate.text.split('\n')[0] || 'Sale');
          }
          results.analyzed++;

          // Auto-publish at confidence >= 0.4 (needs at least discount or price extracted)
          if (extracted.confidence >= 0.4 && extracted.title) {
            const location = resolveLocation(candidate.text, candidate.sourceUrl);
            const result = await publishSale(supabase, store, extracted, candidate.sourceUrl, candidate.source, location);
            if (result === 'deduped') results.skipped++;
            else if (result === 'published') results.published++;
          } else {
            results.pending++;
          }
        } catch (e) { results.errors.push(`Analysis: ${e.message}`); }
      }

      if (!GEMINI_API_KEY) {
        results.errors.push('Gemini not configured — using regex fallback. Enable Generative Language API on GCP project 349289031772.');
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
