export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export type NotificationType =
  | 'match'
  | 'challenge'
  | 'chat'
  | 'payment'
  | 'venue'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  match_id: string | null;
  reason: 'inappropriate' | 'spam' | 'harassment' | 'fake_profile' | 'other';
  description: string | null;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}
