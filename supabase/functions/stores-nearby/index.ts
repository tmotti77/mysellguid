import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const latitude = parseFloat(url.searchParams.get('lat') || '0');
    const longitude = parseFloat(url.searchParams.get('lng') || '0');
    const radius = parseInt(url.searchParams.get('radius') || '5000');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdmin.rpc('get_nearby_stores', {
      p_longitude: longitude,
      p_latitude: latitude,
      p_radius: radius,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
