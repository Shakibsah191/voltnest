import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { clientOrigins, isProd } from './config/env';
import { v1Router } from './routes/v1';
import { notFound } from './shared/middleware/notFound';
import { errorHandler } from './shared/middleware/errorHandler';

export const app = express();

app.set('trust proxy', 1); // Render sits behind a proxy; needed for secure cookies later
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(isProd ? 'combined' : 'dev'));

app.get('/', (_req, res) => {
  res.json({ success: true, data: { name: 'VoltNest API', docs: '/api/v1/health' } });
});

app.use('/api/v1', v1Router);

app.use(notFound);
app.use(errorHandler);
