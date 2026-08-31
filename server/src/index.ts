import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Hono } from 'hono';

config({ path: resolve(process.cwd(), '.env') });

import { app } from './app';

const port = Number(process.env.API_PORT || 8787);
const engine = new Hono();
engine.route('/api', app);

serve({ fetch: engine.fetch, port }, () => {
  console.log(`Pillio API http://localhost:${port}/api`);
});
