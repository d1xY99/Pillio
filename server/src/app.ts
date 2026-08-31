import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { isConfigured } from './lib/env';
import { authRoutes } from './routes/auth';
import { bodyRoutes } from './routes/body';
import { stackRoutes } from './routes/stack';
import { todayRoutes } from './routes/today';
import { trainRoutes } from './routes/train';

export const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.get('/health', (c) =>
  c.json({ ok: true, supabase: isConfigured() }),
);

app.route('/auth', authRoutes);
app.route('/today', todayRoutes);
app.route('/stack', stackRoutes);
app.route('/train', trainRoutes);
app.route('/body', bodyRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('[pillio-api]', err);
  return c.json({ error: err.message || 'Server error' }, 500);
});
