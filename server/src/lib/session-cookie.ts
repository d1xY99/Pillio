import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

export const REFRESH_COOKIE = 'pillio_rt';
const MAX_AGE = 60 * 60 * 24 * 30;

function cookieOpts(c: Context) {
  const https = new URL(c.req.url).protocol === 'https:';
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax' as const,
    secure: https,
    maxAge: MAX_AGE,
  };
}

export function readRefreshCookie(c: Context) {
  return getCookie(c, REFRESH_COOKIE) || '';
}

export function writeRefreshCookie(c: Context, refreshToken: string) {
  setCookie(c, REFRESH_COOKIE, refreshToken, cookieOpts(c));
}

export function clearRefreshCookie(c: Context) {
  deleteCookie(c, REFRESH_COOKIE, { path: '/' });
}
