import express from 'express';
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

const app = express();

// Webhook route needs raw body for Stripe signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// CORS must come BEFORE helmet to ensure preflight OPTIONS work
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, server-to-server, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((allowed) => origin === allowed || origin.endsWith('.vercel.app'))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Helmet with safe defaults that don't break CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('short'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Routes
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

// Error handler
app.use(errorHandler);

// Prevent server crashes from unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
});

const PORT = env.API_PORT || 4000; // v2 reload trigger
app.listen(PORT, () => {
  console.log(`CupidMe API running on port ${PORT}`);
});

export default app;
