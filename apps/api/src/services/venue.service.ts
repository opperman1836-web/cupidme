import { supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { generateQRCode } from '../utils/helpers';
import { relationshipService } from './relationship.service';

export class VenueService {
  async createVenue(ownerId: string, input: {
    name: string;
    description?: string;
    category: string;
    address: string;
    city: string;
    province?: string;
    latitude: number;
    longitude: number;
    phone?: string;
    website?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .insert({ owner_id: ownerId, ...input })
      .select()
      .single();

    if (error) throw new AppError(error.message);

    // Update user role to venue_owner
    await supabaseAdmin
      .from('users')
      .update({ role: 'venue_owner' })
      .eq('id', ownerId);

    return data;
  }

  async getVenues(filters?: {
    city?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    sort_by?: 'name' | 'distance' | 'popularity';
  }) {
    let query = supabaseAdmin
      .from('venues')
      .select('*, venue_offers(count)')
      .eq('status', 'approved');

    if (filters?.city) query = query.eq('city', filters.city);
    if (filters?.category) query = query.eq('category', filters.category);

    const { data, error } = await query.order('name');
    if (error) throw new AppError(error.message);

    let results = data || [];

    // Geo-filter and sort by distance if coordinates provided
    if (filters?.latitude && filters?.longitude) {
      const lat = filters.latitude;
      const lng = filters.longitude;
      const radiusKm = filters.radius_km || 50;

      results = results
        .map((venue) => ({
          ...venue,
          distance_km: venue.latitude && venue.longitude
            ? this.haversineDistance(lat, lng, venue.latitude, venue.longitude)
            : Infinity,
        }))
        .filter((v) => v.distance_km <= radiusKm);

      if (filters.sort_by === 'distance') {
        results.sort((a, b) => a.distance_km - b.distance_km);
      }
    }

    return results;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async getVenue(venueId: string) {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .select('*, venue_offers(*)')
      .eq('id', venueId)
      .single();

    if (error || !data) throw new NotFoundError('Venue');
    return data;
  }

  async getMyVenues(ownerId: string) {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .select('*, venue_offers(*), venue_subscriptions(*)')
      .eq('owner_id', ownerId);

    if (error) throw new AppError(error.message);
    return data || [];
  }

  async updateVenue(venueId: string, ownerId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', venueId)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error) throw new AppError(error.message);
    return data;
  }

  // ── Offers ──

  async createOffer(ownerId: string, input: {
    venue_id: string;
    title: string;
    description: string;
    offer_type: string;
    discount_value?: number;
    min_connection_level?: number;
    max_redemptions?: number;
    valid_from: string;
    valid_until: string;
  }) {
    // Verify ownership
    const { data: venue } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('id', input.venue_id)
      .eq('owner_id', ownerId)
      .single();

    if (!venue) throw new AppError('Venue not found or not owned by you', 403);

    const { data, error } = await supabaseAdmin
      .from('venue_offers')
      .insert(input)
      .select()
      .single();

    if (error) throw new AppError(error.message);
    return data;
  }

  async getOffersForMatch(matchId: string, userId: string) {
    // Get relationship score to filter by connection level
    const score = await relationshipService.getScore(matchId);
    if (!score) return [];

    const { data, error } = await supabaseAdmin
      .from('venue_offers')
      .select('*, venues(name, address, city, category, logo_url)')
      .eq('is_active', true)
      .lte('min_connection_level', score.connection_level)
      .gte('valid_until', new Date().toISOString());

    if (error) throw new AppError(error.message);
    return data || [];
  }

  // ── Redemptions ──

  async generateRedemption(offerId: string, matchId: string, userId: string) {
    const { data: offer } = await supabaseAdmin
      .from('venue_offers')
      .select('*')
      .eq('id', offerId)
      .eq('is_active', true)
      .single();

    if (!offer) throw new NotFoundError('Offer');

    if (offer.max_redemptions && offer.current_redemptions >= offer.max_redemptions) {
      throw new AppError('Offer fully redeemed');
    }

    const qrCode = generateQRCode();

    const { data, error } = await supabaseAdmin
      .from('offer_redemptions')
      .insert({
        offer_id: offerId,
        match_id: matchId,
        redeemed_by_user_id: userId,
        qr_code: qrCode,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message);
    return data;
  }

  async redeemOffer(qrCode: string, venueOwnerId: string) {
    const { data: redemption } = await supabaseAdmin
      .from('offer_redemptions')
      .select('*, venue_offers(venue_id, venues(owner_id))')
      .eq('qr_code', qrCode)
      .single();

    if (!redemption) throw new NotFoundError('Redemption');

    const venue = (redemption.venue_offers as any)?.venues;
    if (venue?.owner_id !== venueOwnerId) {
      throw new AppError('Not your venue offer', 403);
    }

    if (redemption.status !== 'generated' && redemption.status !== 'scanned') {
      throw new AppError('Already redeemed or expired');
    }

    await supabaseAdmin
      .from('offer_redemptions')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('id', redemption.id);

    // Increment redemption counter
    await supabaseAdmin.rpc('increment_redemption_count', {
      p_offer_id: redemption.offer_id,
    });

    // Track venue date for relationship
    await relationshipService.recordEvent(redemption.match_id, 'venue_date');

    return { success: true };
  }

  // ── Analytics ──

  async getVenueAnalytics(venueId: string, ownerId: string) {
    // Verify ownership
    const { data: venue } = await supabaseAdmin
      .from('venues')
      .select('id')
      .eq('id', venueId)
      .eq('owner_id', ownerId)
      .single();

    if (!venue) throw new AppError('Venue not found', 403);

    const { data: offers } = await supabaseAdmin
      .from('venue_offers')
      .select('id, title, current_redemptions, max_redemptions')
      .eq('venue_id', venueId);

    const { count: totalRedemptions } = await supabaseAdmin
      .from('offer_redemptions')
      .select('id', { count: 'exact', head: true })
      .in('offer_id', (offers || []).map((o) => o.id));

    return {
      total_offers: offers?.length || 0,
      total_redemptions: totalRedemptions || 0,
      offers: offers || [],
    };
  }
}

export const venueService = new VenueService();
