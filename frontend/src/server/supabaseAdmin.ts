import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type AppRole = 'brand' | 'clipper' | 'admin';

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  role: AppRole;
}

let adminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client. Never import this from a client component.
 *
 * SUPABASE_URL falls back to NEXT_PUBLIC_SUPABASE_URL so existing Plesk
 * deployments only need to add the service-role secret.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.'
    );
  }

  if (
    serviceRoleKey.startsWith('sb_publishable_') ||
    (publicKey && serviceRoleKey === publicKey)
  ) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY must be the real service_role secret, not the anon/publishable key.'
    );
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}

/**
 * Verifies the Supabase access token from the Authorization header and loads
 * the caller's profile. User ids are never trusted from request bodies.
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;

  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, role')
    .eq('id', data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email,
    username: profile?.username,
    role: (profile?.role as AppRole) || 'clipper',
  };
}
