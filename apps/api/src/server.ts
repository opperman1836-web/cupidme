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

const app = express();

// Webhook route needs raw body for Stripe signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('short'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
app.use('/api/webhooks', webhookRoutes);

// Error handler
app.use(errorHandler);

const PORT = env.API_PORT || 4000;
app.listen(PORT, () => {
  console.log(`CupidMe API running on port ${PORT}`);
});

export default app;
