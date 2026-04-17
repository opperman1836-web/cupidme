'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, Heart, Sparkles, ChevronRight, ChevronLeft,
  MapPin, Calendar, Check, Pen,
} from 'lucide-react';

import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToastStore } from '@/components/ui/Toast';
import { analytics } from '@/lib/analytics';

// Module-level Supabase browser client (session attached automatically via @supabase/ssr)
const supabase = createClient();

function haptic(pattern: number | number[]) {
  try { navigator?.vibrate?.(pattern); } catch {}
}

const INTERESTS = [
  '🎵 Music', '🎬 Movies', '📚 Reading', '✈️ Travel', '🍕 Foodie',
  '🏋️ Fitness', '🎮 Gaming', '📸 Photography', '🎨 Art', '🐕 Dogs',
  '🐱 Cats', '🌱 Nature', '☕ Coffee', '🍷 Wine', '💃 Dancing',
  '🧘 Yoga', '⚽ Sports', '🎤 Karaoke', '🏖️ Beach', '🎭 Theater',
  '👩‍🍳 Cooking', '🚴 Cycling', '📱 Tech', '🎲 Board Games',
];

const STEPS = ['basics', 'photo', 'bio', 'interests'] as const;
type Step = typeof STEPS[number];

export default function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams?.get('edit') === 'true';
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);
  const [step, setStep] = useState<Step>('basics');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    date_of_birth: '',
    gender: 'male',
    gender_preference: 'everyone',
    city: '',
  });
  const maxPhotos = 5; // 5 big Tinder-style slots
  // Flat index-based photo array: photos[0] = slot 1 (main), photos[1] = slot 2, etc.
  // null = empty slot. Length is always maxPhotos.
  const [photos, setPhotos] = useState<(string | null)[]>(() => Array(maxPhotos).fill(null));
  const [uploading, setUploading] = useState<number | null>(null); // slot index currently uploading
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Track onboarding funnel — only fire AFTER the initial load completes
  // (existingProfile starts as null, so we track via a separate "loaded" flag)
  const [profileLoaded, setProfileLoaded] = useState(false);
  useEffect(() => {
    // Only track onboarding_started for genuinely new users (no existing profile, not edit mode)
    if (profileLoaded && !existingProfile && !isEditMode) {
      analytics.trackFunnel('onboarding_started');
    }
  }, [profileLoaded, existingProfile, isEditMode]);

  // Load existing profile through backend API — canonical shape, no direct DB access
  useEffect(() => {
    async function load() {
      if (!token) {
        setProfileLoaded(true);
        return;
      }

      try {
        const res = await api.get<any>('/api/users/me', token);
        const profile = res.data;

        if (profile) {
          // If profile complete + not in edit mode → skip onboarding
          if (profile.profile_complete && !isEditMode) {
            useAuthStore.getState().setProfileComplete(true);
            router.replace('/discover');
            return;
          }

          setExistingProfile(profile);
          setForm({
            display_name: profile.display_name || '',
            bio: profile.bio || '',
            date_of_birth: profile.date_of_birth || '',
            gender: profile.gender || 'male',
            gender_preference: profile.gender_preference || 'everyone',
            city: profile.city || '',
          });

          // photos is already a flat string[] in canonical shape — hydrate into fixed-length slots
          if (Array.isArray(profile.photos) && profile.photos.length) {
            const hydrated: (string | null)[] = Array(maxPhotos).fill(null);
            profile.photos.slice(0, maxPhotos).forEach((url: string, i: number) => {
              hydrated[i] = url;
            });
            setPhotos(hydrated);
          }

          if (Array.isArray(profile.interests) && profile.interests.length) {
            setSelectedInterests(profile.interests);
          }
        }
      } catch (err) {
        // No profile yet — new user. Not an error.
      }
      setProfileLoaded(true);
    }
    load();
  }, [token, router, isEditMode]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleInterest(tag: string) {
    haptic(8);
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 8 ? [...prev, tag] : prev
    );
  }

  /**
   * Upload a photo to a specific slot (0-indexed).
   * Direct to Supabase Storage (`photos` bucket) — gets public URL back.
   * Storage upload is the ONE exception to the "all-through-backend" rule
   * because the Supabase Storage SDK handles multipart + session natively.
   */
  const handlePhotoUpload = async (file: File, index: number) => {
    if (file.size > 10 * 1024 * 1024) {
      addToast('Image too large (max 10MB)', 'error');
      return;
    }

    setUploading(index);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/photo-${index}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      setPhotos((prev) => {
        const updated = [...prev];
        updated[index] = publicUrl;
        return updated;
      });
    } catch (err: any) {
      console.error('[Photo upload] Failed:', err.message);
      addToast(err.message || 'Photo upload failed', 'error');
    } finally {
      setUploading(null);
    }
  };

  function handleSlotChange(index: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      handlePhotoUpload(file, index);
      e.target.value = '';
    };
  }

  function removePhotoAtIndex(index: number) {
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  }

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function nextStep() {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) {
      setDirection(1);
      setStep(STEPS[i + 1]);
    }
  }

  function prevStep() {
    const i = STEPS.indexOf(step);
    if (i > 0) {
      setDirection(-1);
      setStep(STEPS[i - 1]);
    }
  }

  /**
   * Final onboarding submit — all DB writes go through backend API.
   * Order: profile → photos → interests → redirect.
   */
  async function handleComplete() {
    if (!token) {
      addToast('You must be logged in. Please log in again.', 'error');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      analytics.trackFunnel('profile_completed');

      // 1. Upsert profile via backend (canonical endpoint — handles duplicate-key safely)
      await api.post('/api/users/profile', {
        display_name: form.display_name.trim(),
        bio: form.bio.trim() || undefined,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        gender_preference: form.gender_preference,
        city: form.city.trim(),
      }, token);

      // 2. Replace-all photos via backend
      const photoUrls = photos.filter(Boolean) as string[];
      await api.put('/api/users/photos', { photos: photoUrls }, token);

      // 3. Replace-all interests via backend
      await api.put('/api/users/interests', {
        interests: selectedInterests.map((tag) => ({
          interest_tag: tag,
          category: 'general',
        })),
      }, token);

      // 4. Update local state + redirect
      useAuthStore.getState().setProfileComplete(true);

      analytics.track('profile_completed', {
        has_photo: photoUrls.length > 0,
        has_bio: !!form.bio,
        interests_count: selectedInterests.length,
      });

      addToast("Profile complete! Let's find your match 💕", 'success');
      window.location.href = '/discover';
    } catch (err: any) {
      console.error('[handleComplete] Failed:', err?.message);
      addToast(err?.message || 'Failed to save profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const canProceed = {
    basics: form.display_name.trim() && form.date_of_birth && form.city.trim(),
    photo: true, // Optional but encouraged
    bio: true, // Optional but encouraged
    interests: true, // Optional but encouraged
  };

  return (
    <div className="max-w-md mx-auto min-h-[80vh] flex flex-col">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-dark-800 dark:text-dark-200">
            {(existingProfile || isEditMode) ? 'Edit Profile' : 'Set Up Your Profile'}
          </h1>
          <span className="text-sm font-semibold text-cupid-500">
            {stepIndex + 1}/{STEPS.length}
          </span>
        </div>
        <div className="h-2 bg-dark-100 dark:bg-dark-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cupid-400 to-cupid-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 'basics' && (
            <motion.div
              key="basics"
              initial={{ opacity: 0, x: direction * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -80 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-cupid-100 to-cupid-200 dark:from-cupid-900/30 dark:to-cupid-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-cupid-500" />
                </div>
                <h2 className="text-2xl font-black text-dark-900 dark:text-white">The basics</h2>
                <p className="text-dark-500 text-sm mt-1">Let people know who you are</p>
              </div>

              <Input
                label="Your first name"
                value={form.display_name}
                onChange={(e) => update('display_name', e.target.value)}
                placeholder="What should people call you?"
                required
              />
              <Input
                label="Date of birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update('date_of_birth', e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">I am</label>
                <div className="flex gap-2">
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'non_binary', label: 'Non-binary' },
                    { value: 'other', label: 'Other' },
                  ].map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { haptic(8); update('gender', opt.value); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        form.gender === opt.value
                          ? 'bg-cupid-500 text-white shadow-md shadow-cupid-500/20'
                          : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Show me</label>
                <div className="flex gap-2">
                  {[
                    { value: 'everyone', label: 'Everyone' },
                    { value: 'male', label: 'Men' },
                    { value: 'female', label: 'Women' },
                    { value: 'non_binary', label: 'Non-binary' },
                  ].map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { haptic(8); update('gender_preference', opt.value); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        form.gender_preference === opt.value
                          ? 'bg-cupid-500 text-white shadow-md shadow-cupid-500/20'
                          : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              <Input
                label="City"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Cape Town"
                required
              />
            </motion.div>
          )}

          {step === 'photo' && (
            <motion.div
              key="photo"
              initial={{ opacity: 0, x: direction * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -80 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-black text-dark-900 dark:text-white">Add your photos</h2>
                <p className="text-dark-500 text-sm mt-1">Profiles with photos get 10x more matches</p>
              </div>

              {/* Tinder-style photo grid — 5 BIG slots
                  Layout: 1 large main photo (spans 2 cols x 2 rows) + 4 smaller slots beside/below */}
              <div className="grid grid-cols-3 gap-3 auto-rows-[120px] sm:auto-rows-[140px]">
                {photos.map((photoUrl, index) => {
                  const isMain = index === 0;
                  const isUploading = uploading === index;
                  // Main photo takes 2x2 grid cells — makes it BIG like Tinder
                  const gridClass = isMain ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1';

                  return (
                    <label
                      key={index}
                      className={`${gridClass} rounded-2xl overflow-hidden relative group cursor-pointer transition-all ${
                        photoUrl
                          ? 'bg-dark-100 dark:bg-dark-800 shadow-lg ring-1 ring-black/5'
                          : 'border-2 border-dashed border-dark-200 dark:border-dark-700 hover:border-cupid-400 hover:bg-cupid-50/50 dark:hover:bg-cupid-900/10 bg-dark-50 dark:bg-dark-900/50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlotChange(index)}
                        className="hidden"
                        disabled={isUploading}
                      />

                      {photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover overlay — change hint */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                              <Camera className={`${isMain ? 'w-8 h-8' : 'w-5 h-5'} text-white`} />
                            </div>
                          </div>
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removePhotoAtIndex(index);
                            }}
                            className={`absolute top-2 right-2 ${isMain ? 'w-9 h-9' : 'w-7 h-7'} bg-black/70 rounded-full flex items-center justify-center text-white font-bold hover:bg-red-500 transition-colors z-10`}
                            aria-label={`Remove photo ${index + 1}`}
                          >
                            ✕
                          </button>
                          {isMain && (
                            <span className="absolute bottom-3 left-3 text-xs bg-gradient-to-r from-cupid-500 to-cupid-600 text-white px-3 py-1 rounded-full font-bold shadow-lg">
                              Main Photo
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {isUploading ? (
                            <div className={`${isMain ? 'w-10 h-10 border-4' : 'w-6 h-6 border-[3px]'} border-cupid-500 border-t-transparent rounded-full animate-spin`} />
                          ) : (
                            <>
                              <div className={`${isMain ? 'w-14 h-14' : 'w-9 h-9'} rounded-full bg-gradient-to-br from-cupid-400 to-cupid-600 flex items-center justify-center mb-2 shadow-lg`}>
                                <Camera className={`${isMain ? 'w-7 h-7' : 'w-4 h-4'} text-white`} />
                              </div>
                              <span className={`${isMain ? 'text-sm' : 'text-[10px]'} text-dark-500 dark:text-dark-400 font-semibold`}>
                                {isMain ? 'Add Main Photo' : `+ Photo`}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              <p className="text-xs text-dark-400 text-center mt-4">
                {photos.filter(Boolean).length}/{maxPhotos} photos — Tap any slot to upload. Large photo on top is your main.
              </p>
            </motion.div>
          )}

          {step === 'bio' && (
            <motion.div
              key="bio"
              initial={{ opacity: 0, x: direction * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -80 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Pen className="w-8 h-8 text-purple-500" />
                </div>
                <h2 className="text-2xl font-black text-dark-900 dark:text-white">About you</h2>
                <p className="text-dark-500 text-sm mt-1">A great bio makes all the difference</p>
              </div>

              <div>
                <textarea
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  placeholder="I'm a coffee-obsessed adventurer who loves spontaneous road trips and deep conversations..."
                  className="w-full rounded-2xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-5 py-4 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none resize-none h-36 text-dark-900 dark:text-white placeholder:text-dark-400"
                  maxLength={500}
                />
                <p className="text-xs text-dark-400 text-right mt-1">
                  {form.bio.length}/500
                </p>
              </div>

              <div className="bg-cupid-50 dark:bg-cupid-900/20 rounded-2xl p-4">
                <p className="text-sm font-semibold text-cupid-700 dark:text-cupid-300 mb-2">💡 Bio tips:</p>
                <ul className="text-xs text-cupid-600 dark:text-cupid-400 space-y-1">
                  <li>• Mention what you love doing</li>
                  <li>• Share something unique about you</li>
                  <li>• Keep it light and fun</li>
                </ul>
              </div>
            </motion.div>
          )}

          {step === 'interests' && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: direction * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -80 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-black text-dark-900 dark:text-white">Your interests</h2>
                <p className="text-dark-500 text-sm mt-1">
                  Pick up to 8 — helps us find better matches
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((tag) => {
                  const selected = selectedInterests.includes(tag);
                  return (
                    <motion.button
                      key={tag}
                      whileTap={{ scale: [1, 1.2, 0.95, 1.05, 1] }}
                      transition={{ duration: 0.3 }}
                      onClick={() => toggleInterest(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selected
                          ? 'bg-cupid-500 text-white shadow-md shadow-cupid-500/20'
                          : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700'
                      }`}
                    >
                      {tag}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-xs text-dark-400 text-center">
                {selectedInterests.length}/8 selected
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8 pb-6">
        {stepIndex > 0 && (
          <Button variant="outline" onClick={prevStep} className="flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {stepIndex < STEPS.length - 1 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed[step]}
            className="flex-1"
          >
            Continue <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            loading={loading}
            disabled={!form.display_name.trim() || !form.date_of_birth || !form.city.trim()}
            className="flex-1 bg-gradient-to-r from-cupid-500 to-purple-600 hover:from-cupid-600 hover:to-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {existingProfile ? 'Save Changes' : 'Start Matching'}
          </Button>
        )}
      </div>
    </div>
  );
}
