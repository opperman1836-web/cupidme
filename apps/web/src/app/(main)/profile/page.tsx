'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera, Settings, LogOut, Edit3, Shield, MapPin,
  Heart, Crown, ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';
import { InviteBanner } from '@/components/InviteBanner';

/**
 * Profile View Page — shows the authenticated user's profile.
 *
 * Loading states:
 *   1. No token → redirect to /login
 *   2. Loading profile → spinner
 *   3. Profile fetch failed → retry CTA (don't show "Complete Profile" — misleading)
 *   4. Profile exists but incomplete → redirect to /profile/edit (onboarding)
 *   5. Profile complete → render full profile
 */
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const token = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { logout } = useAuth();
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    // Guard: not authenticated → login
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }

    async function load() {
      try {
        const res = await api.get<any>('/api/users/me', token!);
        const data = res.data;

        if (!data) {
          // Profile doesn't exist yet → onboarding
          router.replace('/profile/edit');
          return;
        }

        if (!data.profile_complete) {
          // Profile exists but incomplete → onboarding
          router.replace('/profile/edit');
          return;
        }

        // Profile exists and is complete
        setProfile(data);
        useAuthStore.getState().setProfileComplete(true);
      } catch (err: any) {
        console.error('[Profile] Failed to load:', err);
        setFetchError(true);
      }
      setLoading(false);
    }
    load();
  }, [token, isAuthenticated, router, addToast]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cupid-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Fetch error: can't reach server ──
  if (fetchError) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-24 h-24 bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-dark-300" />
          </div>
          <h2 className="text-2xl font-black text-dark-900 dark:text-white mb-2">
            Couldn&apos;t load your profile
          </h2>
          <p className="text-dark-500 mb-8">
            Check your connection and try again.
          </p>
          <Button onClick={() => window.location.reload()} className="!px-8 !py-3">
            Try again
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── No profile (shouldn't reach here — useEffect redirects — but safety net) ──
  if (!profile) {
    return null;
  }

  // ── Profile exists + complete: render it ──
  const primaryPhoto = profile.user_photos?.find((p: any) => p.is_primary) || profile.user_photos?.[0];
  const photos = profile.user_photos?.sort((a: any, b: any) => a.position - b.position) || [];
  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-dark-900 dark:text-white">My Profile</h1>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm"><Settings className="w-5 h-5" /></Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-5 h-5 text-dark-400" />
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden p-0">
          {/* Cover */}
          <div className="relative h-48 bg-gradient-to-br from-cupid-400 to-cupid-600">
            {primaryPhoto?.url && (
              <img src={primaryPhoto.url} alt="" className="w-full h-full object-cover opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white dark:border-dark-900 shadow-xl bg-white dark:bg-dark-800">
                  {primaryPhoto?.url ? (
                    <img src={primaryPhoto.url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-cupid-50 dark:bg-cupid-900/20 flex items-center justify-center">
                      <Heart className="w-10 h-10 text-cupid-300" />
                    </div>
                  )}
                </div>
                <Link
                  href="/profile/edit"
                  className="absolute -bottom-1 -right-1 w-9 h-9 bg-cupid-500 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-cupid-600 transition-colors"
                  aria-label="Edit photo"
                >
                  <Camera className="w-4 h-4" />
                </Link>
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-dark-900 dark:text-white">{profile.display_name}</h2>
                  {age && <span className="text-xl text-dark-500">{age}</span>}
                  {profile.is_verified && (
                    <Shield className="w-5 h-5 text-blue-500 fill-blue-100" />
                  )}
                </div>
                {profile.city && (
                  <p className="text-dark-500 flex items-center gap-1 text-sm">
                    <MapPin className="w-3.5 h-3.5" /> {profile.city}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-dark-600 dark:text-dark-400 mt-5 leading-relaxed">{profile.bio}</p>
            )}

            {/* Interests */}
            {profile.user_interests?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {profile.user_interests.map((interest: any, i: number) => (
                  <span
                    key={interest.id || i}
                    className="px-3 py-1.5 bg-cupid-50 dark:bg-cupid-900/20 text-cupid-600 dark:text-cupid-400 rounded-full text-sm font-medium"
                  >
                    {interest.interest_tag}
                  </span>
                ))}
              </div>
            )}

            {/* Photo grid */}
            {photos.length > 1 && (
              <div className="grid grid-cols-3 gap-2 mt-5">
                {photos.slice(0, 6).map((photo: any, i: number) => (
                  <div key={photo.id || i} className="aspect-square rounded-xl overflow-hidden bg-dark-100 dark:bg-dark-800">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Edit button */}
            <Link href="/profile/edit?edit=true" className="block mt-6">
              <Button variant="outline" className="w-full">
                <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Invite Banner */}
      <div className="mt-6">
        <InviteBanner />
      </div>

      {/* Quick Links */}
      <div className="mt-6 space-y-2">
        {[
          { href: '/matches', icon: Heart, label: 'My Matches', color: 'text-cupid-500 bg-cupid-50 dark:bg-cupid-900/20' },
          { href: '/venues', icon: MapPin, label: 'Browse Venues', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
          { href: '/payments', icon: Crown, label: 'Premium & Boosts', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
          { href: '/settings', icon: Settings, label: 'Settings', color: 'text-dark-500 bg-dark-50 dark:bg-dark-800' },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card hover className="flex items-center gap-4 !py-3">
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="flex-1 font-semibold text-dark-900 dark:text-white">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-dark-300" />
            </Card>
          </Link>
        ))}
      </div>

      {/* Logout button at bottom */}
      <div className="mt-6 mb-4">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4 mr-2" /> Log out
        </Button>
      </div>
    </div>
  );
}
