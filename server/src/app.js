import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { isS3Storage } from './services/storageService.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getCorsOrigins } from './config/cors.js';

export const createApp = () => {
  const app = express();
  const allowlist = getCorsOrigins();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowlist.includes(origin)) return callback(null, true);
        return callback(new Error('CORS blocked'));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  if (!isS3Storage()) {
    app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
  }
  app.use(
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
      limit: Number(process.env.RATE_LIMIT_MAX || 200)
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ict-incident-tracker-api' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
