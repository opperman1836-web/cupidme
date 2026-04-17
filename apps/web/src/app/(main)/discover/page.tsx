'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  motion, AnimatePresence, useMotionValue, useTransform,
  PanInfo, animate,
} from 'framer-motion';
import {
  Heart, X, MapPin, Sparkles, Camera, Shield,
  RotateCcw, Swords, Zap, Star, Share, ChevronUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToastStore } from '@/components/ui/Toast';
import { SwipeTutorial } from '@/components/SwipeTutorial';

// Canonical profile shape from backend API
interface DiscoverProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  city: string;
  age: number | null;
  is_verified: boolean;
  photos: string[];      // array of public URLs
  interests: string[];   // array of tags
}

// ── Haptics helper — fails silently on desktop ──
function haptic(pattern: number | number[]) {
  try { navigator?.vibrate?.(pattern); } catch {}
}

function getAge(dob: string | undefined | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// ── Floating Hearts Particle Effect ──
function FloatingHearts() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: Math.random() * 300 - 150, y: 100 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.5],
            y: -400 - Math.random() * 200,
            x: Math.random() * 400 - 200,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2"
        >
          <Heart
            className="text-cupid-400 fill-cupid-400"
            style={{ width: 12 + Math.random() * 20, height: 12 + Math.random() * 20 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Match Popup ──
function MatchPopup({
  name, matchId, onClose, onDuel, onShare,
}: {
  name: string; matchId: string; onClose: () => void; onDuel: () => void; onShare: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
      onClick={onClose}
    >
      <FloatingHearts />
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 20 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-900 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl relative z-30"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cupid-400/20 to-purple-500/20 blur-xl -z-10" />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.8, repeat: 3 }}
          className="w-28 h-28 bg-gradient-to-br from-cupid-400 via-cupid-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cupid-500/40"
        >
          <Heart className="w-14 h-14 text-white fill-white" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-black bg-gradient-to-r from-cupid-500 to-purple-600 bg-clip-text text-transparent mb-2"
        >
          It&apos;s a Match!
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-dark-500 dark:text-dark-400 mb-6">
          You and <strong className="text-dark-800 dark:text-white">{name}</strong> like each other
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="space-y-3">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Keep Swiping</Button>
            <Button className="flex-1 bg-gradient-to-r from-cupid-500 to-purple-600 hover:from-cupid-600 hover:to-purple-700" onClick={onDuel}>
              <Swords className="w-4 h-4 mr-2" /> Start Duel
            </Button>
          </div>
          <button onClick={onShare} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-dark-500 dark:text-dark-400 hover:text-cupid-500 transition-colors">
            <Share className="w-4 h-4" /> Tell your friends about this match
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Profile Detail Content (for BottomSheet) ──
function ProfileDetail({ profile }: { profile: DiscoverProfile }) {
  const photos = Array.isArray(profile.photos) ? profile.photos : [];
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const age = profile.age;

  return (
    <div className="space-y-6">
      {/* Photo carousel */}
      {photos.length > 0 && (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2">
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${profile.display_name} photo ${i + 1}`}
              className="w-64 h-80 object-cover rounded-2xl snap-center flex-shrink-0 shadow-lg"
              draggable={false}
            />
          ))}
        </div>
      )}

      {/* Name + age */}
      <div className="flex items-center gap-2">
        <h2 className="text-3xl font-black text-dark-900 dark:text-white">{profile.display_name}</h2>
        {age && <span className="text-2xl font-light text-dark-400">{age}</span>}
        {profile.is_verified && <Shield className="w-5 h-5 text-blue-400 fill-blue-400" />}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-dark-500">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">{profile.city || 'Nearby'}</span>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-dark-600 dark:text-dark-400 leading-relaxed">{profile.bio}</p>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-dark-500 mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((tag, i) => (
              <span key={`${tag}-${i}`} className="px-3 py-1.5 bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 rounded-full text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// ── Main Discover Page ──
// ════════════════════════════════════════
export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gone, setGone] = useState(false);
  const [matchPopup, setMatchPopup] = useState<{ name: string; matchId: string } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [heartPump, setHeartPump] = useState(false);
  const isAnimating = useRef(false);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  // Swipe physics
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const nextScale = useTransform(x, [-300, 0, 300], [1, 0.95, 1]);
  const nextOpacity = useTransform(x, [-300, 0, 300], [1, 0.6, 1]);

  // Load profiles
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/users/discover', token!);
        setProfiles(res.data || []);
      } catch { /* empty feed is fine */ }
      setLoading(false);
    }
    if (token) load(); else setLoading(false);
  }, [token]);

  // Preload next profile images
  useEffect(() => {
    [1, 2].forEach((offset) => {
      const next = profiles[currentIndex + offset];
      if (!next) return;
      (next.photos || []).forEach((url) => {
        const img = new window.Image();
        img.src = url;
      });
    });
  }, [currentIndex, profiles]);

  const advance = useCallback(() => {
    setGone(true);
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setPhotoIndex(0);
      x.jump(0);
      isAnimating.current = false;
      setGone(false);
    }, 50);
  }, [x]);

  const swipeOut = useCallback((direction: 'left' | 'right', onMid?: () => void) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    const targetX = direction === 'right' ? 600 : -600;
    animate(x, targetX, {
      type: 'spring',
      stiffness: 500,
      damping: 40,
      velocity: direction === 'right' ? 1000 : -1000,
      onComplete: advance,
    });
    onMid?.();
  }, [x, advance]);

  const handleLike = useCallback((userId: string) => {
    if (isAnimating.current) return;
    haptic(10);

    // Trigger heart pump animation
    setHeartPump(true);
    setTimeout(() => setHeartPump(false), 500);

    analytics.track('swipe_right', { target_user_id: userId });
    analytics.trackFunnel('swipe_right');
    swipeOut('right', async () => {
      try {
        const res = await api.post<any>('/api/matches/interest', { to_user_id: userId }, token!);
        if (res.data?.mutual) {
          haptic([40, 30, 40]);
          analytics.track('match_created', { match_id: res.data.match_id });
          analytics.trackFunnel('match_created');
          const p = profiles[currentIndex];
          setMatchPopup({ name: p?.display_name || 'Someone', matchId: res.data.match_id });
        }
      } catch (err: any) {
        if (!err.message?.includes('already')) {
          addToast(err.message || 'Failed to send like', 'error');
        }
      }
    });
  }, [token, currentIndex, profiles, swipeOut, addToast]);

  const handleNope = useCallback(() => {
    if (isAnimating.current) return;
    haptic(15);
    analytics.track('swipe_left');
    swipeOut('left');
  }, [swipeOut]);

  function handleDragEnd(_: any, info: PanInfo) {
    if (isAnimating.current) return;
    const profile = profiles[currentIndex];
    if (!profile) return;
    const threshold = 100;
    const vThreshold = 500;
    if (info.offset.x > threshold || info.velocity.x > vThreshold) {
      handleLike(profile.user_id);
    } else if (info.offset.x < -threshold || info.velocity.x < -vThreshold) {
      handleNope();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[85vh]">
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Heart className="w-16 h-16 text-cupid-400" />
        </motion.div>
      </div>
    );
  }

  const profile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];
  const thirdProfile = profiles[currentIndex + 2];

  // ── Empty State ──
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[85vh] text-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-32 h-32 bg-gradient-to-br from-cupid-100 to-cupid-200 dark:from-cupid-900/30 dark:to-cupid-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-16 h-16 text-cupid-400" />
          </div>
          <h2 className="text-2xl font-black text-dark-800 dark:text-dark-200">No more profiles</h2>
          <p className="text-dark-500 mt-2 max-w-xs mx-auto">You&apos;ve seen everyone nearby. New people join every day!</p>
          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={() => {
              setCurrentIndex(0);
              setLoading(true);
              api.get<any>('/api/users/discover', token!).then((res) => { setProfiles(res.data || []); setLoading(false); }).catch(() => setLoading(false));
            }}>
              <RotateCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => router.push('/matches')}>
              <Heart className="w-4 h-4 mr-2" /> View Matches
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const photos: string[] = Array.isArray(profile.photos) ? profile.photos : [];
  const currentPhoto = photos[photoIndex];
  const age = profile.age ?? null;
  const interests: string[] = Array.isArray(profile.interests) ? profile.interests : [];

  return (
    <div className="max-w-md mx-auto relative select-none" style={{ minHeight: '85vh' }}>
      {/* ── Card Stack ── */}
      <div className="relative" style={{ height: '74vh', maxHeight: '660px' }}>

        {/* Third card (deepest — static) */}
        {thirdProfile && (
          <div
            className="absolute inset-4 rounded-3xl overflow-hidden bg-dark-100 dark:bg-dark-800"
            style={{ transform: 'scale(0.90)', opacity: 0.3 }}
          >
            {thirdProfile.photos?.[0] ? (
              <img src={thirdProfile.photos[0]} alt="" className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cupid-100 to-cupid-200 dark:from-cupid-900/30 dark:to-cupid-800/30 flex items-center justify-center">
                <Camera className="w-12 h-12 text-dark-300" />
              </div>
            )}
          </div>
        )}

        {/* Second card (next — moves as top card drags) */}
        {nextProfile && (
          <motion.div
            style={{ scale: nextScale, opacity: nextOpacity }}
            className="absolute inset-2 rounded-3xl overflow-hidden shadow-lg bg-dark-100 dark:bg-dark-800"
          >
            {nextProfile.photos?.[0] ? (
              <img src={nextProfile.photos[0]} alt="" className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cupid-100 to-cupid-200 dark:from-cupid-900/30 dark:to-cupid-800/30 flex items-center justify-center">
                <Camera className="w-12 h-12 text-dark-300" />
              </div>
            )}
          </motion.div>
        )}

        {/* Active card (top — draggable) */}
        {!gone && (
          <motion.div
            key={profile.user_id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            style={{ x, rotate }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing touch-none will-change-transform"
          >
            {/* LIKE stamp overlay with glow */}
            <motion.div style={{ opacity: likeOpacity }} className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute top-14 left-6 border-[4px] border-emerald-400 text-emerald-400 font-black text-4xl tracking-wider px-6 py-2 rounded-xl rotate-[-20deg] backdrop-blur-sm bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                LIKE
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl" />
            </motion.div>

            {/* NOPE stamp overlay with glow */}
            <motion.div style={{ opacity: nopeOpacity }} className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute top-14 right-6 border-[4px] border-red-400 text-red-400 font-black text-4xl tracking-wider px-6 py-2 rounded-xl rotate-[20deg] backdrop-blur-sm bg-red-500/10 shadow-[0_0_30px_rgba(248,113,113,0.3)]">
                NOPE
              </div>
              <div className="absolute inset-0 bg-gradient-to-l from-red-500/20 to-transparent rounded-3xl" />
            </motion.div>

            {/* Photo */}
            <div className="w-full h-full bg-dark-200 dark:bg-dark-800 relative">
              {currentPhoto ? (
                <img src={currentPhoto} alt={profile.display_name} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cupid-200 via-cupid-300 to-purple-400 dark:from-cupid-900 dark:via-cupid-800 dark:to-purple-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-6xl font-black text-white/90">{profile.display_name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <p className="text-white/50 text-sm">No photos yet</p>
                  </div>
                </div>
              )}

              {/* Photo indicators */}
              {photos.length > 1 && (
                <div className="absolute top-3 inset-x-3 flex gap-1 z-30">
                  {photos.map((_, i) => (
                    <div key={i} className={`flex-1 h-[3px] rounded-full transition-all ${i === photoIndex ? 'bg-white shadow-sm shadow-white/50' : 'bg-white/30'}`} />
                  ))}
                </div>
              )}

              {/* Photo nav tap zones */}
              {photos.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setPhotoIndex((i) => Math.max(0, i - 1)); }} className="absolute left-0 top-0 bottom-1/2 w-1/3 z-20" />
                  <button onClick={(e) => { e.stopPropagation(); setPhotoIndex((i) => Math.min(photos.length - 1, i + 1)); }} className="absolute right-0 top-0 bottom-1/2 w-1/3 z-20" />
                </>
              )}

              {/* Profile info overlay — tap to open detail sheet */}
              <button
                onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
                className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-40 z-10 text-left w-full"
              >
                <div className="flex items-end gap-2">
                  <h2 className="text-3xl font-black text-white leading-tight">{profile.display_name}</h2>
                  {age && <span className="text-2xl font-light text-white/80 mb-0.5">{age}</span>}
                  {profile.is_verified && <Shield className="w-5 h-5 text-blue-400 fill-blue-400 mb-1" />}
                </div>
                <div className="flex items-center gap-1.5 text-white/60 mt-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-sm">{profile.city || 'Nearby'}</span>
                </div>
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {interests.slice(0, 5).map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className="px-3 py-1 bg-white/10 backdrop-blur-md text-white/90 rounded-full text-xs font-medium border border-white/10">
                        {tag}
                      </span>
                    ))}
                    {interests.length > 5 && <span className="px-3 py-1 text-white/50 text-xs">+{interests.length - 5}</span>}
                  </div>
                )}
                {profile.bio && <p className="text-white/60 text-sm mt-3 line-clamp-2 leading-relaxed">{profile.bio}</p>}

                {/* "Tap for more" hint */}
                <div className="flex items-center justify-center gap-1 mt-3 text-white/40 text-xs">
                  <ChevronUp className="w-3 h-3" />
                  <span>Tap for more</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-center gap-4 mt-5">
        {/* Nope button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleNope}
          className="w-16 h-16 rounded-full bg-white dark:bg-dark-800 border-2 border-dark-200 dark:border-dark-700 flex items-center justify-center shadow-lg hover:border-red-400 hover:shadow-red-100 dark:hover:shadow-red-900/20 transition-all"
        >
          <X className="w-8 h-8 text-red-500" strokeWidth={3} />
        </motion.button>

        {/* Star button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => router.push('/matches')}
          className="w-12 h-12 rounded-full bg-white dark:bg-dark-800 border-2 border-dark-200 dark:border-dark-700 flex items-center justify-center shadow-md hover:border-blue-300 transition-all"
        >
          <Star className="w-5 h-5 text-blue-500" />
        </motion.button>

        {/* Heart button — with pump animation */}
        <motion.button
          animate={heartPump ? { scale: [1, 1.35, 0.9, 1.1, 1] } : { scale: 1 }}
          transition={heartPump ? { duration: 0.4, ease: 'easeOut' } : {}}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => handleLike(profile.user_id)}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-cupid-400 to-cupid-600 flex items-center justify-center shadow-xl shadow-cupid-500/30 hover:shadow-cupid-500/50 transition-shadow"
        >
          <Heart className="w-10 h-10 text-white fill-white" />
        </motion.button>

        {/* Zap button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => router.push('/duel/invite')}
          className="w-12 h-12 rounded-full bg-white dark:bg-dark-800 border-2 border-dark-200 dark:border-dark-700 flex items-center justify-center shadow-md hover:border-purple-300 transition-all"
        >
          <Zap className="w-5 h-5 text-purple-500" />
        </motion.button>

        {/* Duel button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => router.push('/duel/invite')}
          className="w-16 h-16 rounded-full bg-white dark:bg-dark-800 border-2 border-dark-200 dark:border-dark-700 flex items-center justify-center shadow-lg hover:border-amber-400 hover:shadow-amber-100 dark:hover:shadow-amber-900/20 transition-all"
        >
          <Swords className="w-7 h-7 text-amber-500" />
        </motion.button>
      </div>

      {/* Profile counter pill */}
      <div className="flex justify-center mt-3">
        <span className="bg-dark-100 dark:bg-dark-800 text-dark-500 dark:text-dark-400 px-3 py-1 rounded-full text-xs font-medium tabular-nums">
          {currentIndex + 1} / {profiles.length}
        </span>
      </div>

      {/* ── Profile Detail Bottom Sheet ── */}
      <BottomSheet isOpen={detailOpen} onClose={() => setDetailOpen(false)}>
        <ProfileDetail profile={profile} />
      </BottomSheet>

      {/* ── Match Popup ── */}
      <AnimatePresence>
        {matchPopup && (
          <MatchPopup
            name={matchPopup.name}
            matchId={matchPopup.matchId}
            onClose={() => setMatchPopup(null)}
            onShare={() => {
              const text = 'I just matched with someone on CupidMe! \u{1F495} Challenge your friends to a Cupid Duel';
              const url = 'https://cupidme.app';
              if (navigator.share) {
                navigator.share({ title: 'CupidMe Match!', text, url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${text} ${url}`).then(() => addToast('Link copied!', 'success')).catch(() => {});
              }
              analytics.track('match_shared', { match_id: matchPopup.matchId });
            }}
            onDuel={() => {
              const id = matchPopup.matchId;
              const p = profiles.find((pr) => pr.display_name === matchPopup.name);
              setMatchPopup(null);
              if (p) {
                api.post<any>('/api/duels/create', { opponent_id: p.user_id, match_id: id, type: 'compatibility' }, token!)
                  .then((res) => { if (res.data?.id) router.push(`/duel/play/${res.data.id}`); else router.push('/matches'); })
                  .catch(() => router.push('/matches'));
              } else {
                router.push('/matches');
              }
            }}
          />
        )}
      </AnimatePresence>

      <SwipeTutorial />
    </div>
  );
}
