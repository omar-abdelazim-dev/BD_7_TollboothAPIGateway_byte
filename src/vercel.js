import express from 'express';
import { createAuthService, createBillingService, createUsersService } from './services.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json());

function validKey(value) {
  const expected = process.env.API_KEY;
  if (!expected || typeof value !== 'string' || value.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < value.length; index += 1) difference |= value.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

app.use((req, res, next) => {
  if (req.path === '/api/health') return next();
  if (!validKey(req.get('x-api-key'))) {
    return res.status(401).json({ error: 'INVALID_API_KEY', message: 'A valid X-API-Key is required.' });
  }
  next();
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok', gateway: 'tollbooth', runtime: 'vercel' }));
app.use('/api', createAuthService());
app.use('/api', createUsersService());
app.use('/api', createBillingService());
app.use((_req, res) => res.status(404).json({ error: 'ROUTE_NOT_FOUND', message: 'No microservice is mapped to this path.' }));

export default app;
