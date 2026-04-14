export type VenueCategory =
  | 'coffee_shop'
  | 'restaurant'
  | 'bar'
  | 'activity'
  | 'experience';

export type VenueStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type OfferType = 'percentage_discount' | 'fixed_discount' | 'free_item' | 'special_menu';
export type RedemptionStatus = 'generated' | 'scanned' | 'redeemed' | 'expired';

export interface Venue {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: VenueCategory;
  address: string;
  city: string;
  province: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  status: VenueStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueOffer {
  id: string;
  venue_id: string;
  title: string;
  description: string;
  offer_type: OfferType;
  discount_value: number | null;
  min_connection_level: number;
  max_redemptions: number | null;
  current_redemptions: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface OfferRedemption {
  id: string;
  offer_id: string;
  match_id: string;
  redeemed_by_user_id: string;
  qr_code: string;
  status: RedemptionStatus;
  redeemed_at: string | null;
  created_at: string;
}

export interface VenueSubscription {
  id: string;
  venue_id: string;
  product_id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVenueInput {
  name: string;
  description?: string;
  category: VenueCategory;
  address: string;
  city: string;
  province?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
}

export interface CreateOfferInput {
  venue_id: string;
  title: string;
  description: string;
  offer_type: OfferType;
  discount_value?: number;
  min_connection_level?: number;
  max_redemptions?: number;
  valid_from: string;
  valid_until: string;
}
