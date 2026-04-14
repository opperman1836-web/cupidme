import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import {
  createInvite, getInvitePreview, acceptInvite, acceptInviteAuth,
  trackShare, getViralStats,
} from '../controllers/invite.controller';
import { createInviteSchema, acceptInviteSchema, trackShareSchema } from '../validators/invite.validator';

export const inviteRoutes = Router();

// ── Public routes (no auth required) ──
inviteRoutes.get('/preview/:code', rateLimit(30, 60000), getInvitePreview);
inviteRoutes.post('/:code/accept', rateLimit(5, 60000), validate(acceptInviteSchema), acceptInvite);

// ── Authenticated routes ──
inviteRoutes.use(requireAuth);

inviteRoutes.post('/create', validate(createInviteSchema), createInvite);
inviteRoutes.post('/:code/accept-auth', acceptInviteAuth);
inviteRoutes.post('/track-share', validate(trackShareSchema), trackShare);
inviteRoutes.get('/stats', getViralStats);
