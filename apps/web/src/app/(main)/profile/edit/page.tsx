'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);
  const [step, setStep] = useState<Step>('basics');
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
  const [photos, setPhotos] = useState<{ url: string; position: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const maxPhotos = 10; // Free users: 10, Premium: 30 (checked on save)

  // Track onboarding funnel
  useEffect(() => {
    if (!existingProfile) {
      analytics.trackFunnel('onboarding_started');
    }
  }, [existingProfile]);

  // Load existing profile data if editing
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/users/me', token!);
        if (res.data) {
          setExistingProfile(res.data);
          setForm({
            display_name: res.data.display_name || '',
            bio: res.data.bio || '',
            date_of_birth: res.data.date_of_birth?.split('T')[0] || '',
            gender: res.data.gender || 'male',
            gender_preference: res.data.gender_preference || 'everyone',
            city: res.data.city || '',
          });
          if (res.data.user_photos?.length) {
            setPhotos(res.data.user_photos.map((p: any) => ({ url: p.url, position: p.position })));
          }
          if (res.data.user_interests?.length) {
            setSelectedInterests(res.data.user_interests.map((i: any) => i.interest_tag));
          }
        }
      } catch { /* new profile */ }
    }
    if (token) load();
  }, [token]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleInterest(tag: string) {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 8 ? [...prev, tag] : prev
    );
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photos.length >= maxPhotos) {
      addToast(`Maximum ${maxPhotos} photos for free accounts. Upgrade for more!`, 'error');
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const userId = useAuthStore.getState().userId;

    for (let i = 0; i < files.length; i++) {
      if (photos.length + i >= maxPhotos) break;
      const file = files[i];
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}-${i}.${ext}`;

      const { error } = await supabase.storage
        .from('photo')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) {
        addToast(`Upload failed: ${error.message}`, 'error');
        continue;
      }

      const { data: urlData } = supabase.storage.from('photo').getPublicUrl(path);
      const newPosition = photos.length + i + 1;
      setPhotos((prev) => [...prev, { url: urlData.publicUrl, position: newPosition }]);
    }

    setUploading(false);
    e.target.value = ''; // Reset input
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function nextStep() {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  }

  function prevStep() {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  }

  async function handleComplete() {
    setLoading(true);
    try {
      analytics.trackFunnel('profile_completed');
      // Save profile
      if (existingProfile) {
        await api.patch('/api/users/profile', form, token!);
      } else {
        await api.post('/api/users/profile', form, token!);
      }

      // Save photos
      for (const photo of photos) {
        await api.post('/api/users/photos', { url: photo.url, position: photo.position }, token!);
      }

      // Save interests
      if (selectedInterests.length > 0) {
        await api.put('/api/users/interests', {
          interests: selectedInterests.map((tag) => ({
            interest_tag: tag,
            category: 'general',
          })),
        }, token!);
      }

      analytics.track('profile_completed', {
        has_photo: photos.length > 0,
        has_bio: !!form.bio,
        interests_count: selectedInterests.length,
      });
      addToast('Profile complete! Let\'s find your match 💕', 'success');
      router.push('/discover');
    } catch (err: any) {
      addToast(err.message || 'Failed to save profile', 'error');
    }
    setLoading(false);
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
            {existingProfile ? 'Edit Profile' : 'Set Up Your Profile'}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">I am</label>
                <select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-4 py-3 focus:border-cupid-500 focus:outline-none text-dark-900 dark:text-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Show me</label>
                <select
                  value={form.gender_preference}
                  onChange={(e) => update('gender_preference', e.target.value)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-4 py-3 focus:border-cupid-500 focus:outline-none text-dark-900 dark:text-white"
                >
                  <option value="everyone">Everyone</option>
                  <option value="male">Men</option>
                  <option value="female">Women</option>
                  <option value="non_binary">Non-binary</option>
                </select>
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-black text-dark-900 dark:text-white">Add your photos</h2>
                <p className="text-dark-500 text-sm mt-1">Profiles with photos get 10x more matches</p>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group bg-dark-100 dark:bg-dark-800">
                    <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      ✕
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-cupid-500 text-white px-2 py-0.5 rounded-full font-semibold">
                        Main
                      </span>
                    )}
                  </div>
                ))}

                {/* Upload button */}
                {photos.length < maxPhotos && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-dark-200 dark:border-dark-700 flex flex-col items-center justify-center cursor-pointer hover:border-cupid-400 hover:bg-cupid-50/50 dark:hover:bg-cupid-900/10 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="w-8 h-8 border-3 border-cupid-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-dark-300 mb-1" />
                        <span className="text-xs text-dark-400 font-medium">Add Photo</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              <p className="text-xs text-dark-400 text-center">
                {photos.length}/{maxPhotos} photos — Use clear photos where your face is visible
              </p>
            </motion.div>
          )}

          {step === 'bio' && (
            <motion.div
              key="bio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
                      whileTap={{ scale: 0.95 }}
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
