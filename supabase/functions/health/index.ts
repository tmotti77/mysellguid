import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Test database connection
    const { error } = await supabaseAdmin
      .from('sales')
      .select('id')
      .limit(1);

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: error ? 'disconnected' : 'connected',
      uptime: Math.floor(Math.random() * 1000), // Mock uptime
      memory: {
        used: 50,
        total: 100,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ status: 'error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
