'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, Heart, Sparkles, ChevronRight, ChevronLeft,
  MapPin, Calendar, Check, Pen,
} from 'lucide-react';
import { api } from '@/lib/api';
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
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

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
          if (res.data.user_photos?.[0]?.url) setPhotoUrl(res.data.user_photos[0].url);
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

      // Save photo URL if provided
      if (photoUrl && !existingProfile?.user_photos?.length) {
        await api.post('/api/users/photos', { url: photoUrl, position: 1 }, token!);
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
        has_photo: !!photoUrl,
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
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-black text-dark-900 dark:text-white">Add a photo</h2>
                <p className="text-dark-500 text-sm mt-1">Profiles with photos get 10x more matches</p>
              </div>

              <div className="flex justify-center">
                <div className="w-48 h-48 rounded-3xl border-3 border-dashed border-dark-200 dark:border-dark-700 flex items-center justify-center bg-dark-50 dark:bg-dark-800/50 overflow-hidden relative">
                  {photoUrl ? (
                    <>
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-sm hover:bg-black/70"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-10 h-10 text-dark-300 mx-auto mb-2" />
                      <p className="text-xs text-dark-400">Paste a photo URL below</p>
                    </div>
                  )}
                </div>
              </div>

              <Input
                label="Photo URL"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
              />
              <p className="text-xs text-dark-400 text-center">
                Tip: Use a clear, recent photo where your face is visible
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
