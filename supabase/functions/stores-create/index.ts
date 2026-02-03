import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { name, description, category, address, city, country, phoneNumber, email,
            website, instagramHandle, latitude, longitude } = body;

    // Validate required fields
    if (!name || !address || !city) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, address, city' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PostGIS location as EWKT string (geometry column with SRID 4326)
    const location = `SRID=4326;POINT(${Number(longitude)} ${Number(latitude)})`;

    // Create store
    const storeData: any = {
      name,
      description: description || '',
      category: category || 'other',
      address,
      city,
      country: country || 'Israel',
      phoneNumber: phoneNumber || null,
      email: email || null,
      website: website || null,
      instagramHandle: instagramHandle || null,
      latitude,
      longitude,
      location,
      ownerId: user.id,
      isVerified: false,
      isActive: true,
      totalSales: 0,
      views: 0,
      rating: 0,
      reviewCount: 0,
    };

    const { data: newStore, error: createError } = await supabase
      .from('stores')
      .insert(storeData)
      .select()
      .single();

    if (createError) {
      console.error('Create error:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(newStore), {
      status: 201,
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
