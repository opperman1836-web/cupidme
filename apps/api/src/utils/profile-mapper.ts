/**
 * Canonical Profile Shape
 *
 * This is the ONE profile object that the backend returns to frontend.
 * All endpoints that return profile data (user's own, public preview, discover feed)
 * MUST use `toCanonicalProfile()` to shape the response.
 *
 * Frontend code should only ever see this shape — never raw DB columns.
 */
export interface CanonicalProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  date_of_birth: string | null;  // ISO date (YYYY-MM-DD) — needed by edit form
  city: string | null;
  country: string | null;
  gender: string | null;
  gender_preference: string | null;
  photos: string[];              // Public URLs, sorted by position ASC
  interests: string[];           // Interest tags
  profile_complete: boolean;
  is_verified: boolean;
}

function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const t = Date.now() - new Date(dob).getTime();
  if (isNaN(t)) return null;
  return Math.floor(t / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Map a raw DB row (profiles + joined user_photos + joined user_interests)
 * into the canonical shape.
 *
 * Accepts either:
 *  - A single profile row with nested `user_photos` and `user_interests` arrays
 *  - A profile row plus separately-fetched photos and interests arrays
 */
export function toCanonicalProfile(
  profile: any,
  opts?: { photos?: any[]; interests?: any[] }
): CanonicalProfile {
  const photoRows = opts?.photos ?? profile.user_photos ?? [];
  const interestRows = opts?.interests ?? profile.user_interests ?? [];

  const photos = [...photoRows]
    .sort((a: any, b: any) => (a.position ?? 99) - (b.position ?? 99))
    .map((p: any) => p.url)
    .filter(Boolean);

  const interests = interestRows
    .map((i: any) => i.interest_tag)
    .filter(Boolean);

  // Normalize date_of_birth to YYYY-MM-DD for form prefill
  let dob: string | null = null;
  if (profile.date_of_birth) {
    const s = String(profile.date_of_birth);
    dob = s.includes('T') ? s.split('T')[0] : s;
  }

  return {
    user_id: profile.user_id,
    display_name: profile.display_name || '',
    bio: profile.bio || null,
    age: calcAge(profile.date_of_birth),
    date_of_birth: dob,
    city: profile.city || null,
    country: profile.country || null,
    gender: profile.gender || null,
    gender_preference: profile.gender_preference || null,
    photos,
    interests,
    profile_complete: !!profile.profile_complete,
    is_verified: !!profile.is_verified,
  };
}
