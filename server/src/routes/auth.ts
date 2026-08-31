import { Hono } from 'hono';

import { requireUser, type AuthEnv } from '../lib/auth';
import { anonClient, userClient } from '../lib/supabase';

export const authRoutes = new Hono<AuthEnv>();

authRoutes.post('/sign-up', async (c) => {
  const body = await c.req.json<{ name?: string; email?: string; password?: string }>();
  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';
  if (!name || !email || !password) return c.json({ error: 'Name, email, and password are required' }, 400);

  const supabase = anonClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });
  if (error) return c.json({ error: error.message }, 400);

  if (data.user && data.session) {
    await userClient(data.session.access_token).from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      display_name: name,
    });
  }

  if (!data.session) {
    return c.json({ error: 'Check your email to confirm the account, then sign in.', needsConfirmation: true }, 200);
  }

  return c.json({ session: data.session, user: publicUser(data.session.user, name) });
});

authRoutes.post('/sign-in', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';
  if (!email || !password) return c.json({ error: 'Email and password are required' }, 400);

  const { data, error } = await anonClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) return c.json({ error: error?.message ?? 'Could not sign in' }, 401);
  return c.json({ session: data.session, user: publicUser(data.session.user) });
});

authRoutes.post('/refresh', async (c) => {
  const body = await c.req.json<{ refreshToken?: string }>();
  if (!body.refreshToken) return c.json({ error: 'Missing refresh token' }, 400);
  const { data, error } = await anonClient().auth.refreshSession({ refresh_token: body.refreshToken });
  if (error || !data.session) return c.json({ error: error?.message ?? 'Could not refresh' }, 401);
  return c.json({ session: data.session, user: publicUser(data.session.user) });
});

authRoutes.post('/sign-out', requireUser, async (c) => {
  await userClient(c.get('token')).auth.signOut();
  return c.json({ ok: true });
});

authRoutes.get('/me', requireUser, async (c) => {
  const token = c.get('token');
  const { data } = await userClient(token).auth.getUser(token);
  if (!data.user) return c.json({ error: 'Session expired' }, 401);
  const { data: profile } = await userClient(token)
    .from('profiles')
    .select('display_name')
    .eq('id', data.user.id)
    .maybeSingle();
  return c.json({ user: publicUser(data.user, (profile?.display_name as string | undefined) ?? '') });
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
