function clean(value?: string) {
  return (value ?? '').trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, '');
}

export function supabaseUrl() {
  return supabaseUrlCandidates()[0] || '';
}

export function supabaseUrlCandidates() {
  return [...new Set([
    clean(process.env.EXPO_PUBLIC_SUPABASE_URL),
    clean(process.env.SUPABASE_URL),
    'https://ydinypcgkpqjjfxvqnrf.supabase.co',
  ].filter((value) => value.startsWith('http')))];
}

export function supabaseAnonKey() {
  return clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) || clean(process.env.SUPABASE_ANON_KEY);
}

export function isConfigured() {
  return supabaseUrl().startsWith('http') && supabaseAnonKey().length > 20;
}

export function supabaseHost() {
  try {
    return new URL(supabaseUrl()).host;
  } catch {
    return 'invalid';
  }
}
