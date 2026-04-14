'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera, Settings, LogOut, Edit3, Shield, MapPin, Calendar,
  Heart, Zap, Star, Trophy, Gift, Crown, ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';
import { InviteBanner } from '@/components/InviteBanner';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const { logout } = useAuth();
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/users/me', token!);
        setProfile(res.data);
      } catch {
        addToast('Failed to load profile', 'error');
      }
      setLoading(false);
    }
    if (token) {
      load();
    } else {
      setLoading(false);
    }
  }, [token, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cupid-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 bg-cupid-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-cupid-300" />
          </div>
          <h2 className="text-2xl font-black text-dark-900 mb-2">Complete Your Profile</h2>
          <p className="text-dark-500 mb-8">Set up your profile to start discovering matches nearby.</p>
          <Link href="/profile/edit">
            <Button className="!px-8 !py-3">
              <Edit3 className="w-4 h-4 mr-2" /> Create Profile
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const primaryPhoto = profile.user_photos?.find((p: any) => p.is_primary);
  const photos = profile.user_photos?.sort((a: any, b: any) => a.position - b.position) || [];
  const age = profile.date_of_birth
    ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
    : null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-dark-900">My Profile</h1>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden p-0">
          {/* Photo + Cover */}
          <div className="relative h-48 bg-gradient-to-br from-cupid-400 to-cupid-600">
            {primaryPhoto?.url && (
              <img src={primaryPhoto.url} alt="" className="w-full h-full object-cover opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-white">
                  {primaryPhoto?.url ? (
                    <img src={primaryPhoto.url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-cupid-50 flex items-center justify-center">
                      <Heart className="w-10 h-10 text-cupid-300" />
                    </div>
                  )}
                </div>
                <Link
                  href="/profile/edit"
                  className="absolute -bottom-1 -right-1 w-9 h-9 bg-cupid-500 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-cupid-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </Link>
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-dark-900">{profile.display_name}</h2>
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
              <p className="text-dark-600 mt-5 leading-relaxed">{profile.bio}</p>
            )}

            {/* Interests */}
            {profile.user_interests?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {profile.user_interests.map((interest: any) => (
                  <span
                    key={interest.id}
                    className="px-3 py-1.5 bg-cupid-50 text-cupid-600 rounded-full text-sm font-medium"
                  >
                    {interest.tag || interest.interest_tag}
                  </span>
                ))}
              </div>
            )}

            {/* Photo grid */}
            {photos.length > 1 && (
              <div className="grid grid-cols-3 gap-2 mt-5">
                {photos.slice(0, 6).map((photo: any, i: number) => (
                  <div key={photo.id || i} className="aspect-square rounded-xl overflow-hidden bg-dark-100">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Edit button */}
            <Link href="/profile/edit" className="block mt-6">
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
          { href: '/matches', icon: Heart, label: 'My Matches', color: 'text-cupid-500 bg-cupid-50' },
          { href: '/venues', icon: MapPin, label: 'Browse Venues', color: 'text-blue-500 bg-blue-50' },
          { href: '/payments', icon: Crown, label: 'Premium & Boosts', color: 'text-amber-500 bg-amber-50' },
          { href: '/settings', icon: Settings, label: 'Settings', color: 'text-dark-500 bg-dark-50' },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card hover className="flex items-center gap-4 !py-3">
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="flex-1 font-semibold text-dark-900">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-dark-300" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
