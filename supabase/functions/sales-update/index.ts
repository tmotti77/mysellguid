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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const saleId = pathParts[pathParts.length - 1];

    if (!saleId || saleId === 'sales-update') {
      return new Response(
        JSON.stringify({ error: 'Sale ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Get the sale to verify ownership
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('storeId, stores!inner(ownerId)')
      .eq('id', saleId)
      .single();

    if (fetchError || !sale) {
      return new Response(
        JSON.stringify({ error: 'Sale not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the store
    if ((sale as any).stores.ownerId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only update sales for your own stores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.discountPercentage !== undefined) updateData.discountPercentage = body.discountPercentage;
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice;
    if (body.salePrice !== undefined) updateData.salePrice = body.salePrice;
    if (body.currency) updateData.currency = body.currency;
    if (body.startDate) updateData.startDate = body.startDate;
    if (body.endDate) updateData.endDate = body.endDate;
    if (body.status) updateData.status = body.status;
    if (body.images) updateData.images = Array.isArray(body.images) ? body.images.join(',') : body.images;

    // Update location if coordinates changed
    if (body.latitude && body.longitude) {
      updateData.latitude = body.latitude;
      updateData.longitude = body.longitude;
      updateData.location = `SRID=4326;POINT(${Number(body.longitude)} ${Number(body.latitude)})`;
    }

    // Update the sale
    const { data: updatedSale, error: updateError } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', saleId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format response
    const formattedSale = {
      ...updatedSale,
      images: updatedSale.images ? updatedSale.images.split(',') : [],
    };

    return new Response(JSON.stringify(formattedSale), {
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
