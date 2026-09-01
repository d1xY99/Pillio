import { accessToken, readSession, refreshToken, writeSession, type ApiSession } from './session';

export function apiBase() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return '';
    }
  }
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  return '';
}

export function isApiConfigured() {
  return Boolean(apiBase() || process.env.EXPO_PUBLIC_SUPABASE_URL);
}

async function parse(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function refreshAccess(): Promise<string | null> {
  const token = refreshToken();
  if (!token) return null;
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: token }),
    });
  } catch {
    return null;
  }
  const body = await parse(res);
  if (!res.ok || !body.session) {
    if (res.status === 401) writeSession(null);
    return null;
  }
  const next = body.session as ApiSession;
  const previous = readSession();
  writeSession({ ...next, user: next.user ?? previous?.user });
  return next.access_token;
}

export async function api<T = any>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let token = accessToken();
  const publicAuth =
    path === '/auth/sign-in' ||
    path === '/auth/sign-up' ||
    path === '/auth/forgot-password' ||
    path === '/auth/refresh' ||
    path === '/auth/session' ||
    path === '/auth/sign-out';
  const skipAuth = init.auth === false || publicAuth;
  if (!skipAuth && token) headers.set('Authorization', `Bearer ${token}`);
  if (path === '/auth/session' && token) headers.set('Authorization', `Bearer ${token}`);

  const url = `${apiBase()}/api${path}`;
  const run = () => fetch(url, { ...init, headers, credentials: 'include' });

  let res: Response;
  try {
    res = await run();
  } catch {
    const hint = apiBase()
      ? `Cannot reach ${apiBase()}. Start the API: npm run api`
      : 'API is not reachable. On this phone use https://pillioo.netlify.app. Locally run npm run api.';
    throw new Error(hint);
  }
  if (res.status === 401 && !skipAuth && token) {
    const next = await refreshAccess();
    if (next) {
      headers.set('Authorization', `Bearer ${next}`);
      res = await run();
    }
  }

  const body = await parse(res);
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const apiPatch = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) });
export const apiDelete = <T>(path: string) => api<T>(path, { method: 'DELETE' });

export function clientTz() {
  return {
    tzOffset: new Date().getTimezoneOffset(),
    now: Date.now(),
  };
}
