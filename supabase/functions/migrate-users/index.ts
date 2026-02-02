import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MIGRATION_SECRET = Deno.env.get('MIGRATION_SECRET') || 'change-me-in-production';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check secret key for security
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');

    if (secret !== MIGRATION_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid migration secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all users from the old users table
    const { data: oldUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch old users: ' + fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      total: oldUsers?.length || 0,
      migrated: 0,
      skipped: 0,
      errors: [] as any[],
    };

    // Migrate each user
    for (const oldUser of oldUsers || []) {
      try {
        // Check if user already exists in Supabase Auth
        const { data: existingUser } = await supabase.auth.admin.getUserById(oldUser.id);

        if (existingUser.user) {
          results.skipped++;
          continue;
        }

        // Create user in Supabase Auth with same ID
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          id: oldUser.id, // Preserve the same UUID
          email: oldUser.email,
          password: 'TempPassword123!', // Temporary password - users should reset
          email_confirm: true,
          user_metadata: {
            firstName: oldUser.firstName || '',
            lastName: oldUser.lastName || '',
            role: oldUser.role || 'user',
            phoneNumber: oldUser.phoneNumber || '',
            migratedFrom: 'old_users_table',
            migratedAt: new Date().toISOString(),
          },
        });

        if (createError) {
          results.errors.push({
            email: oldUser.email,
            error: createError.message,
          });
        } else {
          results.migrated++;
        }
      } catch (error: any) {
        results.errors.push({
          email: oldUser.email,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration completed',
        results,
        note: 'Users have been migrated with temporary password: TempPassword123! - They should use password reset.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
