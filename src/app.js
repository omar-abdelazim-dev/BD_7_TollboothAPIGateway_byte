import express from 'express';
import { createGateway } from './gateway.js';
import { createLogger } from './logger.js';

export function createApp(options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy ?? false);
  const logger = options.logger ?? createLogger(options.logPath ?? process.env.LOG_PATH ?? './logs/gateway.jsonl');
  const proxy = createGateway({
    app, logger,
    apiKey: options.apiKey ?? process.env.API_KEY ?? 'development-key-change-me',
    authUrl: options.authUrl ?? process.env.AUTH_SERVICE_URL ?? 'http://127.0.0.1:4101',
    usersUrl: options.usersUrl ?? process.env.USERS_SERVICE_URL ?? 'http://127.0.0.1:4102',
    billingUrl: options.billingUrl ?? process.env.BILLING_SERVICE_URL ?? 'http://127.0.0.1:4103'
  });
  return { app, logger, proxy };
}
