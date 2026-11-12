import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { clientOrigins, env, isProd } from './config/env';
import { v1Router } from './routes/v1';
import { notFound } from './shared/middleware/notFound';
import { errorHandler } from './shared/middleware/errorHandler';

export const app = express();

// How many proxies sit in front of us. Live: Vercel's /api rewrite → Render's proxy → us = 2.
// Getting this right makes req.ip the shopper's real IP, which the rate limits rely on.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? (isProd ? 2 : 1)));
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
if (env.NODE_ENV !== 'test') app.use(morgan(isProd ? 'combined' : 'dev')); // quiet during npm test

app.get('/', (_req, res) => {
  res.json({ success: true, data: { name: 'VoltNest API', docs: '/api/v1/health' } });
});

app.use('/api/v1', v1Router);

app.use(notFound);
app.use(errorHandler);
