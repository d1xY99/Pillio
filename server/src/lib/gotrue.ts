import { supabaseAnonKey, supabaseUrlCandidates } from './env';

type GotrueUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

export type GotrueSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: GotrueUser;
};

async function gotrue<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: T & { error?: string; msg?: string; error_description?: string } }> {
  const headers = new Headers(init.headers);
  headers.set('apikey', supabaseAnonKey());
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${supabaseAnonKey()}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const bases = supabaseUrlCandidates();
  if (!bases.length) throw new Error('Supabase URL is not configured');

  let res: Response | undefined;
  let lastCause = 'fetch failed';
  for (const base of bases) {
    try {
      res = await fetch(`${base}/auth/v1${path}`, { ...init, headers });
      break;
    } catch (error) {
      lastCause = error instanceof Error ? error.message : 'fetch failed';
    }
  }
  if (!res) throw new Error(`Could not reach Supabase Auth (${lastCause})`);

  const body = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    msg?: string;
    error_description?: string;
    msg_code?: string;
  };
  return { ok: res.ok, status: res.status, body };
}

function sessionFrom(body: any): GotrueSession | null {
  if (!body?.access_token || !body?.user?.id) return null;
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: body.expires_at,
    user: body.user,
  };
}

function messageOf(body: { error?: string; msg?: string; error_description?: string }) {
  return body.msg || body.error_description || body.error || 'Auth request failed';
}

export async function passwordSignIn(email: string, password: string) {
  const { ok, body } = await gotrue<GotrueSession>('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const session = sessionFrom(body);
  if (!ok || !session) return { error: humanAuthError(messageOf(body)) };
  return { session };
}

export async function passwordSignUp(email: string, password: string, name: string) {
  const { ok, body } = await gotrue<GotrueSession>('/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      data: { display_name: name },
    }),
  });
  if (!ok) return { error: humanAuthError(messageOf(body)) };
  const session = sessionFrom(body);
  return { session, user: (body as any).user as GotrueUser | undefined };
}

export async function refreshSession(refreshToken: string) {
  const { ok, body } = await gotrue<GotrueSession>('/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const session = sessionFrom(body);
  if (!ok || !session) return { error: messageOf(body) };
  return { session };
}

export async function requestPasswordReset(email: string) {
  const { ok, body } = await gotrue('/recover', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!ok) return { error: messageOf(body) };
  return { ok: true as const };
}

export async function updatePassword(accessToken: string, password: string) {
  const { ok, body } = await gotrue('/user', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password }),
  });
  if (!ok) return { error: messageOf(body) };
  return { ok: true as const };
}

export async function getAuthUser(accessToken: string) {
  const { ok, body } = await gotrue<GotrueUser>('/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!ok || !(body as any).id) return null;
  return body as GotrueUser;
}

function humanAuthError(message: string) {
  if (/confirm/i.test(message)) {
    return 'This email is not confirmed yet. Turn off Confirm email in Supabase, or use the link in your inbox.';
  }
  if (/invalid/i.test(message)) return 'Wrong email or password.';
  return message;
}
