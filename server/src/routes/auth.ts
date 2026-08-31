import { Hono } from 'hono';

import { requireUser, type AuthEnv } from '../lib/auth';
import { getAuthUser, passwordSignIn, passwordSignUp, refreshSession } from '../lib/gotrue';
import { userClient } from '../lib/supabase';

export const authRoutes = new Hono<AuthEnv>();

authRoutes.post('/sign-up', async (c) => {
  const body = await c.req.json<{ name?: string; email?: string; password?: string }>();
  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';
  if (!name || !email || !password) return c.json({ error: 'Name, email, and password are required' }, 400);

  const result = await passwordSignUp(email, password, name);
  if ('error' in result && result.error) return c.json({ error: result.error }, 400);

  if (result.session) {
    await userClient(result.session.access_token).from('profiles').upsert({
      id: result.session.user.id,
      email: result.session.user.email,
      display_name: name,
    });
    return c.json({ session: result.session, user: publicUser(result.session.user, name) });
  }

  return c.json({ error: 'Check your email to confirm the account, then sign in.', needsConfirmation: true }, 200);
});

authRoutes.post('/sign-in', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';
  if (!email || !password) return c.json({ error: 'Email and password are required' }, 400);

  const result = await passwordSignIn(email, password);
  if ('error' in result && result.error) return c.json({ error: result.error }, 400);
  if (!result.session) return c.json({ error: 'Could not sign in' }, 400);
  return c.json({ session: result.session, user: publicUser(result.session.user) });
});

authRoutes.post('/refresh', async (c) => {
  const body = await c.req.json<{ refreshToken?: string }>();
  if (!body.refreshToken) return c.json({ error: 'Missing refresh token' }, 400);
  const result = await refreshSession(body.refreshToken);
  if ('error' in result && result.error) return c.json({ error: result.error }, 401);
  if (!result.session) return c.json({ error: 'Could not refresh' }, 401);
  return c.json({ session: result.session, user: publicUser(result.session.user) });
});

authRoutes.post('/sign-out', requireUser, async (c) => {
  return c.json({ ok: true });
});

authRoutes.get('/me', requireUser, async (c) => {
  const token = c.get('token');
  const user = await getAuthUser(token);
  if (!user) return c.json({ error: 'Session expired' }, 401);
  const { data: profile } = await userClient(token)
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();
  return c.json({ user: publicUser(user, (profile?.display_name as string | undefined) ?? '') });
});

function publicUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }, name?: string) {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      name ||
      (typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '') ||
      '',
  };
}
