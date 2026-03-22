import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';

export const authRoutes = Router();

authRoutes.post('/register', rateLimit(5, 60000), register);
authRoutes.post('/login', rateLimit(10, 60000), login);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', requireAuth, logout);
