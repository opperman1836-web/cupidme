const Router = require('express').Router;
import { requireAuth } from '../middleware/auth.middleware';
import {
  createVenue, getVenues, getVenue, getMyVenues, updateVenue,
  createOffer, getOffersForMatch, generateRedemption, redeemOffer,
  getAnalytics,
} from '../controllers/venue.controller';

export const venueRoutes = Router();

// Public — specific routes BEFORE param routes
venueRoutes.get('/', getVenues);

// Authenticated routes — must come before /:venueId catch-all
venueRoutes.use(requireAuth);

venueRoutes.get('/my/venues', getMyVenues);
venueRoutes.post('/', createVenue);
venueRoutes.post('/offers', createOffer);
venueRoutes.get('/offers/match/:matchId', getOffersForMatch);
venueRoutes.post('/redemptions', generateRedemption);
venueRoutes.post('/redemptions/redeem', redeemOffer);

// Param routes LAST
venueRoutes.get('/:venueId', getVenue);
venueRoutes.patch('/:venueId', updateVenue);
venueRoutes.get('/:venueId/analytics', getAnalytics);
