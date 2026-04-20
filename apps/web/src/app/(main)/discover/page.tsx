'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  motion, AnimatePresence, useMotionValue, useTransform,
  PanInfo, animate,
} from 'framer-motion';
import {
  Heart, X, MapPin, Sparkles, Camera, RotateCcw, Share, Swords,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';

// Canonical profile shape (matches backend)
interface DiscoverProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  city: string;
  age: number | null;
  is_verified: boolean;
  photos: string[];
  interests: string[];
}

// Haptics — fails silently on desktop
function haptic(pattern: number | number[]) {
  try { navigator?.vibrate?.(pattern); } catch {}
}

// ── Floating Hearts (match popup) ──
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
          transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
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
  name, onClose, onDuel, onShare,
}: {
  name: string; onClose: () => void; onDuel: () => void; onShare: () => void;
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
        className="bg-dark-900 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl relative z-30 border border-white/10"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-cupid-400 via-cupid-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Heart className="w-12 h-12 text-white fill-white" />
        </div>
        <h2 className="text-3xl font-black bg-gradient-to-r from-cupid-500 to-purple-600 bg-clip-text text-transparent mb-2">
          It&apos;s a Match!
        </h2>
        <p className="text-dark-300 mb-6">
          You and <strong className="text-white">{name}</strong> like each other
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Keep Swiping</Button>
          <Button className="flex-1 bg-gradient-to-r from-cupid-500 to-purple-600" onClick={onDuel}>
            <Swords className="w-4 h-4 mr-2" /> Start Duel
          </Button>
        </div>
        <button
          onClick={onShare}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-dark-400 hover:text-cupid-500"
        >
          <Share className="w-4 h-4" /> Share this match
        </button>
      </motion.div>
    </motion.div>
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

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/users/discover', token!);
        setProfiles(res.data || []);
      } catch (err: any) {
        addToast(err?.message || 'Failed to load profiles', 'error');
      }
      setLoading(false);
    }
    if (token) load(); else setLoading(false);
  }, [token, addToast]);

  // Preload next photos
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
    analytics.track('swipe_right', { target_user_id: userId });
    swipeOut('right', async () => {
      try {
        const res = await api.post<any>('/api/matches/interest', { to_user_id: userId }, token!);
        if (res.data?.mutual) {
          haptic([40, 30, 40]);
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
    const p = profiles[currentIndex];
    if (!p) return;
    const threshold = 100;
    const vThreshold = 500;
    if (info.offset.x > threshold || info.velocity.x > vThreshold) {
      handleLike(p.user_id);
    } else if (info.offset.x < -threshold || info.velocity.x < -vThreshold) {
      handleNope();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Heart className="w-16 h-16 text-cupid-400" fill="currentColor" />
        </motion.div>
      </div>
    );
  }

  const profile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];
  const thirdProfile = profiles[currentIndex + 2];

  // ── EMPTY STATE ──
  // We're a new platform — never show "dead" empty UI to a fresh user.
  // Always offer a real next action: invite friends or expand search radius.
  if (!profile) {
    async function expandRadius() {
      try {
        await api.patch('/api/users/profile', { max_distance_km: 200 }, token!);
        addToast('Search expanded to 200 km', 'success');
        setCurrentIndex(0);
        setLoading(true);
        const res = await api.get<any>('/api/users/discover', token!);
        setProfiles(res.data || []);
      } catch (err: any) {
        addToast(err?.message || 'Failed to expand radius', 'error');
      } finally {
        setLoading(false);
      }
    }

    function inviteFriends() {
      const text = "I'm on CupidMe — a new dating platform where you actually earn dates by completing fun challenges. Join me!";
      const url = typeof window !== 'undefined' ? window.location.origin : 'https://cupidme.app';
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        (navigator as any).share({ title: 'CupidMe', text, url }).catch(() => {});
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(`${text} ${url}`)
          .then(() => addToast('Invite link copied!', 'success'))
          .catch(() => {});
      }
    }

    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black px-6 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-cupid-400/20 to-cupid-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-12 h-12 text-cupid-400" />
        </div>
        <h2 className="text-2xl font-black text-white">We&apos;re growing!</h2>
        <p className="text-white/70 mt-2 max-w-xs">
          New people join CupidMe every day. Invite friends to grow the community,
          or widen your search to find more matches nearby.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-sm">
          <Button onClick={inviteFriends} className="flex-1">
            <Share className="w-4 h-4 mr-2" /> Invite Friends
          </Button>
          <Button variant="outline" onClick={expandRadius} className="flex-1">
            <MapPin className="w-4 h-4 mr-2" /> Expand Search
          </Button>
        </div>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setLoading(true);
            api.get<any>('/api/users/discover', token!)
              .then((res) => { setProfiles(res.data || []); setLoading(false); })
              .catch(() => setLoading(false));
          }}
          className="mt-5 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh
        </button>
        <button
          onClick={() => router.push('/matches')}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          <Heart className="w-3.5 h-3.5" /> View Matches
        </button>
      </div>
    );
  }

  // ── STEP 4: Photo selection with fallback ──
  const photos: string[] = Array.isArray(profile.photos) ? profile.photos : [];
  const currentPhoto = photos[photoIndex];

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black overflow-hidden">

      {/* ── STEP 5: Card stack container (relative, fixed height) ── */}
      <div
        className="relative w-[90vw] max-w-sm"
        style={{ height: '70vh', maxHeight: '660px' }}
      >
        {/* Third card — deepest, static, barely visible */}
        {thirdProfile && (
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden bg-gray-900 z-0"
            style={{ transform: 'scale(0.9) translateY(16px)', opacity: 0.4 }}
          >
            {thirdProfile.photos?.[0] ? (
              <img src={thirdProfile.photos[0]} alt="" className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cupid-900/30 to-purple-900/30" />
            )}
          </div>
        )}

        {/* Second card — moves slightly as top drags */}
        {nextProfile && (
          <motion.div
            style={{ scale: nextScale, opacity: nextOpacity }}
            className="absolute inset-0 rounded-2xl overflow-hidden bg-gray-900 z-10"
          >
            {nextProfile.photos?.[0] ? (
              <img src={nextProfile.photos[0]} alt="" className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cupid-900/40 to-purple-900/40 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white/30" />
              </div>
            )}
            <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
              <h2 className="text-white text-xl font-bold">
                {nextProfile.display_name} {nextProfile.age ?? ''}
              </h2>
            </div>
          </motion.div>
        )}

        {/* Active card — on top, draggable */}
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
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl bg-gray-900 cursor-grab active:cursor-grabbing touch-none will-change-transform z-20"
          >
            {/* LIKE stamp */}
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-6 z-30 pointer-events-none">
              <div className="border-4 border-emerald-400 text-emerald-400 font-black text-3xl tracking-wider px-4 py-1 rounded-xl rotate-[-18deg] backdrop-blur-sm bg-emerald-500/10">
                LIKE
              </div>
            </motion.div>

            {/* NOPE stamp */}
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-6 z-30 pointer-events-none">
              <div className="border-4 border-red-400 text-red-400 font-black text-3xl tracking-wider px-4 py-1 rounded-xl rotate-[18deg] backdrop-blur-sm bg-red-500/10">
                NOPE
              </div>
            </motion.div>

            {/* Photo with fallback */}
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={profile.display_name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cupid-700 to-purple-800 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-3">
                  <span className="text-5xl font-black text-white">
                    {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <p className="text-white/60 text-sm">No photo yet</p>
              </div>
            )}

            {/* Photo nav tap zones */}
            {photos.length > 1 && (
              <>
                <div className="absolute top-3 inset-x-3 flex gap-1 z-30">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-[3px] rounded-full transition-colors ${
                        i === photoIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setPhotoIndex((i) => Math.max(0, i - 1)); }}
                  className="absolute left-0 top-0 bottom-1/2 w-1/3 z-20"
                  aria-label="Previous photo"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setPhotoIndex((i) => Math.min(photos.length - 1, i + 1)); }}
                  className="absolute right-0 top-0 bottom-1/2 w-1/3 z-20"
                  aria-label="Next photo"
                />
              </>
            )}

            {/* Name + age overlay (minimal) */}
            <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10">
              <div className="flex items-end gap-2">
                <h2 className="text-white text-3xl font-black">
                  {profile.display_name}
                </h2>
                {profile.age && (
                  <span className="text-white/80 text-2xl font-light mb-0.5">{profile.age}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Buttons — minimal, Tinder-style */}
      <div className="flex gap-10 mt-8">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleNope}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg"
          aria-label="Pass"
        >
          <X className="w-8 h-8 text-red-500" strokeWidth={3} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => handleLike(profile.user_id)}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg"
          aria-label="Like"
        >
          <Heart className="w-8 h-8 text-emerald-500" fill="currentColor" />
        </motion.button>
      </div>

      {/* Counter */}
      <p className="text-white/40 text-xs mt-4 tabular-nums">
        {currentIndex + 1} / {profiles.length}
      </p>

      {/* Match popup */}
      <AnimatePresence>
        {matchPopup && (
          <MatchPopup
            name={matchPopup.name}
            onClose={() => setMatchPopup(null)}
            onShare={() => {
              const text = 'I just matched on CupidMe! 💕';
              if (navigator.share) {
                navigator.share({ title: 'CupidMe Match!', text, url: 'https://cupidme.app' }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text).then(() => addToast('Link copied!', 'success')).catch(() => {});
              }
            }}
            onDuel={() => {
              const id = matchPopup.matchId;
              setMatchPopup(null);
              router.push(`/matches`);
              void id;
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
