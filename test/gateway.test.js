import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createAuthService, createBillingService, createUsersService } from '../src/services.js';

async function server(app) {
  const instance = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => instance.once('listening', resolve));
  return { instance, url: `http://127.0.0.1:${instance.address().port}` };
}

test('gateway authenticates, routes to all three services, and writes centralized logs', async (t) => {
  const [auth, users, billing] = await Promise.all([server(createAuthService()), server(createUsersService()), server(createBillingService())]);
  const directory = await mkdtemp(join(tmpdir(), 'tollbooth-'));
  const { app, logger, proxy } = createApp({ apiKey: 'correct-key', authUrl: auth.url, usersUrl: users.url, billingUrl: billing.url, logPath: join(directory, 'gateway.jsonl') });
  t.after(async () => {
    proxy.close();
    await Promise.all([auth, users, billing].map(({ instance }) => new Promise((resolve) => instance.close(resolve))));
  });

  assert.equal((await request(app).get('/users')).status, 401);
  const usersResponse = await request(app).get('/users').set('X-API-Key', 'correct-key');
  assert.equal(usersResponse.status, 200);
  assert.equal(usersResponse.body.service, 'users');
  const authResponse = await request(app).post('/auth/login').set('X-API-Key', 'correct-key').send({ email: 'a@b.com', password: 'secret' });
  assert.equal(authResponse.body.service, 'auth');
  const billingResponse = await request(app).get('/billing/invoices').set('X-API-Key', 'correct-key');
  assert.equal(billingResponse.body.service, 'billing');
  assert.equal((await request(app).get('/unknown').set('X-API-Key', 'correct-key')).status, 404);

  await logger.flush();
  const rows = (await readFile(join(directory, 'gateway.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.map((row) => row.targetRoute), ['users', 'users', 'auth', 'billing', 'unmatched']);
  assert.equal(rows.every((row) => row.timestamp && row.clientIp && row.method), true);
});
