import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { isConfigured, supabaseHost } from './lib/env';
import { authRoutes } from './routes/auth';
import { bodyRoutes } from './routes/body';
import { habitsRoutes } from './routes/habits';
import { stackRoutes } from './routes/stack';
import { todayRoutes } from './routes/today';
import { trainRoutes } from './routes/train';

export const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  }),
);

app.get('/health', (c) =>
  c.json({ ok: true, supabase: isConfigured(), host: supabaseHost() }),
);

app.route('/auth', authRoutes);
app.route('/today', todayRoutes);
app.route('/stack', stackRoutes);
app.route('/habits', habitsRoutes);
app.route('/train', trainRoutes);
app.route('/body', bodyRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('[pillio-api]', err);
  return c.json({ error: err.message || 'Server error' }, 500);
});
