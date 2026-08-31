export function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
}

export function supabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
}

export function isConfigured() {
  return supabaseUrl().startsWith('http') && supabaseAnonKey().length > 20;
}
