import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'POST required. Body: { title, discountPercentage, ... }' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { title, description, discountPercentage, originalPrice, salePrice, category, storeName, sourceUrl, latitude, longitude } = body;

    if (!title || !discountPercentage) {
      return new Response(
        JSON.stringify({ error: 'title and discountPercentage are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find or create "User Reports" store
    const { data: existingStore } = await supabase.from('stores').select('*').eq('name', 'User Reports').maybeSingle();
    let store = existingStore;

    if (!store) {
      const { data: users } = await supabase.from('users').select('id').limit(1);
      const ownerId = users?.[0]?.id;
      if (!ownerId) {
        return new Response(
          JSON.stringify({ error: 'System error: no users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: created, error: storeErr } = await supabase.from('stores').insert({
        id: crypto.randomUUID(),
        name: 'User Reports',
        description: 'Sales reported by community members',
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

      if (storeErr) {
        return new Response(
          JSON.stringify({ error: 'Failed to create store: ' + storeErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      store = created;
    }

    // If storeName provided, try to match an existing store
    let targetStore = store;
    if (storeName && storeName.trim().length > 1) {
      const { data: namedStore } = await supabase
        .from('stores')
        .select('*')
        .ilike('name', `%${storeName.trim()}%`)
        .limit(1)
        .maybeSingle();
      if (namedStore) targetStore = namedStore;
    }

    const now = new Date().toISOString();
    const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Use caller-provided location if valid, otherwise fall back to matched store
    const lat = latitude != null && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : Number(targetStore.latitude);
    const lng = longitude != null && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : Number(targetStore.longitude);

    const { data: sale, error: saleErr } = await supabase.from('sales').insert({
      id: crypto.randomUUID(),
      title: title.slice(0, 120),
      description: (description || '').slice(0, 1000),
      storeId: targetStore.id,
      category: category || 'other',
      discountPercentage: discountPercentage || null,
      originalPrice: originalPrice || null,
      salePrice: salePrice || null,
      currency: 'ILS',
      startDate: now,
      endDate,
      status: 'active',
      images: '',
      latitude: lat,
      longitude: lng,
      location: `SRID=4326;POINT(${lng} ${lat})`,
      source: 'user_report',
      sourceUrl: sourceUrl || '',
      sourceType: 'community',
      autoDiscovered: false,
      views: 0,
      clicks: 0,
      shares: 0,
      saves: 0,
      createdAt: now,
      updatedAt: now,
    }).select().single();

    if (saleErr) {
      return new Response(
        JSON.stringify({ error: 'Insert failed: ' + saleErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ ok: true, sale }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
