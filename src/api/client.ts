import { accessToken, refreshToken, writeSession, type ApiSession } from './session';

export function apiBase() {
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
  const res = await fetch(`${apiBase()}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token }),
  });
  const body = await parse(res);
  if (!res.ok || !body.session) {
    writeSession(null);
    return null;
  }
  writeSession(body.session as ApiSession);
  return body.session.access_token as string;
}

export async function api<T = any>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let token = accessToken();
  if (init.auth !== false && token) headers.set('Authorization', `Bearer ${token}`);

  const run = () =>
    fetch(`${apiBase()}/api${path}`, {
      ...init,
      headers,
    });

  let res = await run();
  if (res.status === 401 && init.auth !== false) {
    token = await refreshAccess();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
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
