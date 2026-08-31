import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabaseAnonKey, supabaseUrl } from './env';

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: globalThis.fetch.bind(globalThis) },
};

export function anonClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseAnonKey(), clientOptions);
}

export function userClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    ...clientOptions,
    global: {
      ...clientOptions.global,
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
