import { createMiddleware } from 'hono/factory';

import { userClient } from './supabase';

export type AuthEnv = {
  Variables: {
    token: string;
    userId: string;
    email: string;
  };
};

export const requireUser = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.json({ error: 'Sign in required' }, 401);

  const { data, error } = await userClient(token).auth.getUser(token);
  if (error || !data.user) return c.json({ error: 'Session expired' }, 401);

  c.set('token', token);
  c.set('userId', data.user.id);
  c.set('email', data.user.email ?? '');
  await next();
});

export function db(c: { get: (key: 'token') => string }) {
  return userClient(c.get('token'));
}
