import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  createVenue, getVenues, getVenue, getMyVenues, updateVenue,
  createOffer, getOffersForMatch, generateRedemption, redeemOffer,
  getAnalytics,
} from '../controllers/venue.controller';

export const venueRoutes = Router();

// Public
venueRoutes.get('/', getVenues);
venueRoutes.get('/:venueId', getVenue);

// Authenticated
venueRoutes.use(requireAuth);

venueRoutes.post('/', createVenue);
venueRoutes.get('/my/venues', getMyVenues);
venueRoutes.patch('/:venueId', updateVenue);
venueRoutes.post('/offers', createOffer);
venueRoutes.get('/offers/match/:matchId', getOffersForMatch);
venueRoutes.post('/redemptions', generateRedemption);
venueRoutes.post('/redemptions/redeem', redeemOffer);
venueRoutes.get('/:venueId/analytics', getAnalytics);
