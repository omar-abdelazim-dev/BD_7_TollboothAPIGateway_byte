import { createApp } from './app.js';
import { createAuthService, createBillingService, createUsersService } from './services.js';
import vercelApp from './vercel.js';

function listen(app, port, label) {
  return app.listen(port, '127.0.0.1', () => console.log(`${label} listening on ${port}`));
}
let app = vercelApp;
let logger;
let proxy;
let services = [];
let gateway;
if (!process.env.VERCEL) {
  services = [
    listen(createAuthService(), Number(process.env.AUTH_PORT ?? 4101), 'Auth service'),
    listen(createUsersService(), Number(process.env.USERS_PORT ?? 4102), 'Users service'),
    listen(createBillingService(), Number(process.env.BILLING_PORT ?? 4103), 'Billing service')
  ];
  ({ app, logger, proxy } = createApp());
  gateway = listen(app, Number(process.env.PORT ?? 4000), 'Tollbooth gateway');
}
export default app;

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  proxy?.close();
  await Promise.all([...services, gateway].filter(Boolean).map((server) => new Promise((resolve) => server.close(resolve))));
  await logger?.flush();
  process.exit(0);
}
if (!process.env.VERCEL) {
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
