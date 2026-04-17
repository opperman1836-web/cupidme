import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { matchRoutes } from './routes/match.routes';
import { challengeRoutes } from './routes/challenge.routes';
import { chatRoutes } from './routes/chat.routes';
import { paymentRoutes } from './routes/payment.routes';
import { venueRoutes } from './routes/venue.routes';
import { adminRoutes } from './routes/admin.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { duelRoutes } from './routes/duel.routes';
import { inviteRoutes } from './routes/invite.routes';
import { notificationRoutes } from './routes/notification.routes';
import { publicRoutes } from './routes/public.routes';

const app = express();

// Webhook route needs raw body for Stripe signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// CORS
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o: string) => o.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((allowed: string) => origin === allowed || origin.endsWith('.vercel.app'))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('short'));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0', environment: env.NODE_ENV, timestamp: new Date().toISOString() });
});
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0', environment: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/public', publicRoutes); // Unauthenticated preview endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/duels', duelRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
});

const PORT = env.API_PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CupidMe API running on port ${PORT} (${env.NODE_ENV})`);
});

export default app;
