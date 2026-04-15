import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';

export const authRoutes = Router();

authRoutes.post('/register', rateLimit(30, 60000), validate(registerSchema), register);
authRoutes.post('/login', rateLimit(30, 60000), validate(loginSchema), login);
authRoutes.post('/refresh', validate(refreshSchema), refresh);
authRoutes.post('/logout', requireAuth, logout);
