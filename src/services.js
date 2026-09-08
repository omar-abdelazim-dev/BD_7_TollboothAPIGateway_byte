import express from 'express';

function service(name) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ service: name, status: 'ok' }));
  return app;
}

export function createAuthService() {
  const app = service('auth');
  app.post('/auth/login', (req, res) => {
    if (!req.body?.email || !req.body?.password) return res.status(400).json({ error: 'MISSING_CREDENTIALS' });
    res.json({ service: 'auth', accessToken: 'demo-internal-token', user: { email: req.body.email } });
  });
  return app;
}

export function createUsersService() {
  const app = service('users');
  app.get('/users', (_req, res) => res.json({ service: 'users', data: [{ id: 'u_1', name: 'Ada Lovelace' }] }));
  app.get('/users/:id', (req, res) => res.json({ service: 'users', data: { id: req.params.id, name: 'Ada Lovelace' } }));
  return app;
}

export function createBillingService() {
  const app = service('billing');
  app.get('/billing/invoices', (_req, res) => res.json({ service: 'billing', data: [{ id: 'inv_1', amount: 49.99, currency: 'USD' }] }));
  return app;
}
