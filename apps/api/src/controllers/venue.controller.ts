import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { venueService } from '../services/venue.service';

export async function createVenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const venue = await venueService.createVenue(req.userId!, req.body);
    res.status(201).json({ success: true, data: venue });
  } catch (err) { next(err); }
}

export async function getVenues(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { city, category, latitude, longitude, radius_km, sort_by } = req.query;
    const venues = await venueService.getVenues({
      city: city as string,
      category: category as string,
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      radius_km: radius_km ? parseFloat(radius_km as string) : undefined,
      sort_by: sort_by as 'name' | 'distance' | 'popularity',
    });
    res.json({ success: true, data: venues });
  } catch (err) { next(err); }
}

export async function getVenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const venue = await venueService.getVenue(req.params.venueId);
    res.json({ success: true, data: venue });
  } catch (err) { next(err); }
}

export async function getMyVenues(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const venues = await venueService.getMyVenues(req.userId!);
    res.json({ success: true, data: venues });
  } catch (err) { next(err); }
}

export async function updateVenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const venue = await venueService.updateVenue(req.params.venueId, req.userId!, req.body);
    res.json({ success: true, data: venue });
  } catch (err) { next(err); }
}

export async function createOffer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const offer = await venueService.createOffer(req.userId!, req.body);
    res.status(201).json({ success: true, data: offer });
  } catch (err) { next(err); }
}

export async function getOffersForMatch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const offers = await venueService.getOffersForMatch(req.params.matchId, req.userId!);
    res.json({ success: true, data: offers });
  } catch (err) { next(err); }
}

export async function generateRedemption(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const redemption = await venueService.generateRedemption(
      req.body.offer_id, req.body.match_id, req.userId!
    );
    res.status(201).json({ success: true, data: redemption });
  } catch (err) { next(err); }
}

export async function redeemOffer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await venueService.redeemOffer(req.body.qr_code, req.userId!);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const analytics = await venueService.getVenueAnalytics(req.params.venueId, req.userId!);
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
}
