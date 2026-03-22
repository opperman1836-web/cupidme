'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';

interface DiscoverProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  city: string;
  date_of_birth: string;
  user_photos: { url: string; is_primary: boolean }[];
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/users/discover', token!);
        setProfiles(res.data || []);
      } catch {
        addToast('Failed to load profiles', 'error');
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token, addToast]);

  async function handleInterest(userId: string) {
    try {
      const res = await api.post<any>('/api/matches/interest', { to_user_id: userId }, token!);
      if (res.data?.mutual) {
        addToast("It's mutual! Challenge time!", 'success');
      } else {
        addToast('Interest sent!', 'info');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
    setCurrentIndex((i) => i + 1);
  }

  function handleSkip() {
    setCurrentIndex((i) => i + 1);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-dark-400">Loading profiles...</div>;
  }

  const profile = profiles[currentIndex];

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Heart className="w-16 h-16 text-dark-200 mb-4" />
        <h2 className="text-xl font-bold text-dark-700">No more profiles</h2>
        <p className="text-dark-400 mt-2">Check back later for new people in your area.</p>
      </div>
    );
  }

  const primaryPhoto = profile.user_photos?.find((p) => p.is_primary)?.url;
  const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear();

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Discover</h1>
      <AnimatePresence mode="wait">
        <motion.div
          key={profile.user_id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, x: -200 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden p-0">
            <div className="h-96 bg-dark-100 relative">
              {primaryPhoto ? (
                <img src={primaryPhoto} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-dark-300">
                  <Heart className="w-20 h-20" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h2 className="text-2xl font-bold text-white">{profile.display_name}, {age}</h2>
                <div className="flex items-center gap-1 text-white/80 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.city}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              {profile.bio && <p className="text-dark-600 mb-4">{profile.bio}</p>}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleSkip}>
                  <X className="w-5 h-5 mr-1" /> Skip
                </Button>
                <Button className="flex-1" onClick={() => handleInterest(profile.user_id)}>
                  <Heart className="w-5 h-5 mr-1" /> Interested
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
      <p className="text-center text-sm text-dark-400 mt-4">
        {currentIndex + 1} of {profiles.length}
      </p>
    </div>
  );
}
