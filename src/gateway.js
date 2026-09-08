import httpProxy from 'http-proxy';

const ROUTES = [
  { prefix: '/auth', service: 'auth', option: 'authUrl' },
  { prefix: '/users', service: 'users', option: 'usersUrl' },
  { prefix: '/billing', service: 'billing', option: 'billingUrl' }
];

function equalKeys(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string' || actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < actual.length; index += 1) mismatch |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  return mismatch === 0;
}

export function createGateway({ app, apiKey, logger, authUrl, usersUrl, billingUrl }) {
  const proxy = httpProxy.createProxyServer({ xfwd: true, proxyTimeout: 10_000, timeout: 12_000 });
  proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('x-api-key'));
  proxy.on('error', (error, _req, res) => {
    console.error('Upstream error:', error.message);
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'UPSTREAM_UNAVAILABLE', message: 'The target service is unavailable.' }));
  });

  app.use((req, res, next) => {
    const route = ROUTES.find((candidate) => req.path === candidate.prefix || req.path.startsWith(`${candidate.prefix}/`));
    logger.write({ timestamp: new Date().toISOString(), clientIp: req.ip, method: req.method, targetRoute: route?.service ?? 'unmatched', path: req.originalUrl });
    if (req.path === '/health') return res.json({ status: 'ok', gateway: 'tollbooth' });
    if (!equalKeys(req.get('x-api-key'), apiKey)) {
      return res.status(401).json({ error: 'INVALID_API_KEY', message: 'A valid X-API-Key is required.' });
    }
    if (!route) return res.status(404).json({ error: 'ROUTE_NOT_FOUND', message: 'No internal service matches this path.' });
    proxy.web(req, res, { target: { authUrl, usersUrl, billingUrl }[route.option] });
  });
  return proxy;
}
