'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Heart,
  Sparkles,
  Shield,
  MapPin,
  Star,
  Coffee,
  Utensils,
  Trophy,
  Zap,
  ChevronRight,
  Globe,
  Users,
  Store,
  ArrowRight,
  CheckCircle2,
  Crown,
  MessageCircle,
  Clock,
  Gift,
  QrCode,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// ── Public profile preview ──
interface PublicProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  city: string | null;
  photos: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Intersection Observer hook for section reveals
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  return { ref, isInView };
}

// Animated counter component
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="stat-number">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Floating hearts background
function FloatingHearts() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0.1, y: '100vh' }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            y: '-10vh',
            x: [0, (i % 2 === 0 ? 30 : -30), 0],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            delay: i * 3,
            ease: 'linear',
          }}
          style={{ left: `${10 + i * 15}%` }}
        >
          <Heart
            className={`${i % 2 === 0 ? 'w-6 h-6' : 'w-4 h-4'} text-cupid-300/40 fill-cupid-300/20`}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Testimonial data
const testimonials = [
  {
    name: 'Sarah & James',
    location: 'Cape Town',
    text: 'We completed a challenge about our life goals. That one question started a conversation that hasn\'t stopped since.',
    avatar: '👩‍❤️‍👨',
    rating: 5,
  },
  {
    name: 'Thabo & Lerato',
    location: 'Johannesburg',
    text: 'Our first date was sponsored by a coffee shop on CupidMe. Now we go back every anniversary.',
    avatar: '💑',
    rating: 5,
  },
  {
    name: 'Priya & Michael',
    location: 'Durban',
    text: 'The challenges made us vulnerable before we even met. By our first date, we already knew this was real.',
    avatar: '👫',
    rating: 5,
  },
];

// How it works steps
const steps = [
  {
    icon: Heart,
    title: 'Express Interest',
    description: 'See someone special? Express genuine interest. When it\'s mutual, the magic begins.',
    color: 'from-cupid-400 to-cupid-600',
  },
  {
    icon: Sparkles,
    title: 'Complete Challenges',
    description: 'Answer thoughtful questions evaluated by AI. Prove you\'re serious about connection.',
    color: 'from-violet-400 to-violet-600',
  },
  {
    icon: MessageCircle,
    title: 'Unlock Chat',
    description: 'Pass the challenge to unlock a 48-hour chat window. Every message deepens your bond.',
    color: 'from-blue-400 to-blue-600',
  },
  {
    icon: MapPin,
    title: 'Go On Real Dates',
    description: 'Unlock exclusive offers from partner venues. Coffee, dinner, experiences — all earned.',
    color: 'from-emerald-400 to-emerald-600',
  },
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const stats = useReveal();
  const howItWorks = useReveal();
  const venues = useReveal();
  const testimonialSection = useReveal();
  const business = useReveal();
  const profilesPreview = useReveal();

  // Public profiles preview — fetched on mount, no auth required
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfiles() {
      try {
        const res = await fetch(`${API_URL}/api/public/profiles`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setProfiles(json.data || []);
      } catch (err) {
        console.warn('[Landing] Failed to load public profiles:', err);
      } finally {
        if (!cancelled) setProfilesLoading(false);
      }
    }
    fetchProfiles();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-dark-50 overflow-hidden">
      {/* Navigation */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50"
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-xl flex items-center justify-center shadow-glow">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-extrabold text-dark-900">
                Cupid<span className="text-gradient">Me</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-dark-600 hover:text-cupid-500 transition-colors">
                How It Works
              </a>
              <a href="#venues" className="text-sm font-medium text-dark-600 hover:text-cupid-500 transition-colors">
                For Venues
              </a>
              <a href="#testimonials" className="text-sm font-medium text-dark-600 hover:text-cupid-500 transition-colors">
                Stories
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-dark-700 hover:text-cupid-500 transition-colors"
              >
                Log In
              </Link>
              <Link href="/register" className="btn-premium px-5 py-2.5 text-sm rounded-xl">
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-16"
      >
        {/* Background elements */}
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-cupid-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-cupid-100/40 rounded-full blur-3xl" />
        <FloatingHearts />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge with social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 glass-cupid rounded-full px-5 py-2 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-cupid-700">2,847 people joined this week</span>
          </motion.div>

          {/* Main Headline — emotional + curiosity */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-8xl font-black text-dark-900 leading-[0.95] tracking-tight text-balance"
          >
            Stop Swiping.
            <br />
            <span className="text-gradient bg-gradient-to-r from-cupid-500 via-cupid-400 to-cupid-600 bg-[length:200%_100%] animate-gradient">
              Start Earning Love.
            </span>
          </motion.h1>

          {/* Subheadline — benefit-driven + curiosity gap */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 text-lg sm:text-xl text-dark-500 max-w-2xl mx-auto leading-relaxed"
          >
            Complete fun AI challenges with your match. Prove you&apos;re serious.
            <br className="hidden sm:block" />
            <strong className="text-dark-700">Unlock free dates at real restaurants and venues.</strong>
          </motion.p>

          {/* Primary CTA — single, focused, action-driven */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <Link
              href="/register"
              className="group btn-premium px-10 py-5 text-lg rounded-2xl inline-flex items-center justify-center gap-3 shadow-2xl shadow-cupid-500/25 hover:shadow-cupid-500/40 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Take Your First Challenge — Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="text-sm text-dark-400 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Free forever. No credit card needed.
            </span>
          </motion.div>

          {/* Trust indicators + social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-dark-400"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              AI-Verified Profiles
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              850+ Venue Partners
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-cupid-500 fill-cupid-500" />
              12,000+ Matches Made
            </span>
          </motion.div>

          {/* Venue CTA — secondary, below fold */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="mt-6"
          >
            <Link
              href="/register?role=venue"
              className="text-sm font-medium text-dark-500 hover:text-cupid-500 transition-colors inline-flex items-center gap-1"
            >
              <Store className="w-4 h-4" />
              Are you a venue owner? Partner with us
              <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-dark-300 rounded-full flex items-start justify-center p-1"
            >
              <motion.div
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-cupid-500 rounded-full"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Public Profiles Preview Grid ── */}
      <section ref={profilesPreview.ref} className="relative py-20 bg-gradient-to-b from-dark-50 to-white overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cupid-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-200/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={profilesPreview.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-cupid-500 font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live Right Now
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-dark-900 mt-3 text-balance">
              Meet People <span className="text-gradient">Nearby</span>
            </h2>
            <p className="mt-4 text-lg text-dark-500 max-w-xl mx-auto">
              Real singles on CupidMe today. Sign up to express interest and start earning your first date.
            </p>
          </motion.div>

          {/* Grid wrapper with blur-lock overlay for unauthenticated users */}
          <div className="relative">
            {/* Grid — 2 cols mobile, 3 cols tablet, 4 cols desktop */}
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 ${!isAuthenticated ? 'pointer-events-none select-none' : ''}`}>
              {profilesLoading
                ? // Skeleton cards
                  Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={`skel-${i}`}
                      className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-dark-100 to-dark-200 animate-pulse"
                    />
                  ))
                : profiles.length === 0
                ? (
                  <div className="col-span-full text-center py-12 text-dark-400">
                    Profiles loading…
                  </div>
                )
                : profiles.map((profile, i) => {
                    const mainPhoto = profile.photos?.[0];
                    const firstName = profile.display_name?.split(' ')[0] || profile.display_name;
                    return (
                      <motion.div
                        key={profile.user_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={profilesPreview.isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                      >
                        {mainPhoto ? (
                          <img
                            src={mainPhoto}
                            alt={firstName}
                            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                              !isAuthenticated ? 'blur-md' : ''
                            }`}
                            loading="lazy"
                            draggable={false}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br from-cupid-200 via-cupid-300 to-purple-400 flex items-center justify-center ${
                            !isAuthenticated ? 'blur-md' : ''
                          }`}>
                            <span className="text-6xl font-black text-white/80">
                              {firstName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}

                        {/* Gradient overlay for text legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                        {/* Text overlay: name + age + city */}
                        <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4">
                          <div className="flex items-end gap-1.5">
                            <h3 className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow">
                              {firstName}
                            </h3>
                            {profile.age && (
                              <span className="text-white/80 text-sm sm:text-base font-light mb-0.5">
                                {profile.age}
                              </span>
                            )}
                          </div>
                          {profile.city && (
                            <p className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{profile.city}</span>
                            </p>
                          )}
                        </div>

                        {/* Live pulse dot (top-right corner) */}
                        <div className="absolute top-2 right-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white/50" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
            </div>

            {/* Blur-lock overlay — shown only when NOT authenticated */}
            {!isAuthenticated && !profilesLoading && profiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="pointer-events-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-dark-100 px-8 py-6 sm:px-10 sm:py-8 max-w-sm mx-4 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-dark-900 mb-2">
                    Sign up to start matching
                  </h3>
                  <p className="text-sm text-dark-500 mb-5">
                    See full profiles, express interest, and earn free dates.
                  </p>
                  <Link
                    href="/register"
                    className="btn-premium px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2 w-full justify-center shadow-lg shadow-cupid-500/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    Get Started — Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-xs text-dark-400 mt-3">
                    Already have an account?{' '}
                    <Link href="/login" className="text-cupid-500 font-semibold hover:underline">
                      Log in
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section ref={stats.ref} className="relative py-20 bg-dark-900">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={stats.isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto px-4 sm:px-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 50000, suffix: '+', label: 'Active Users' },
              { value: 12000, suffix: '+', label: 'Matches Made' },
              { value: 850, suffix: '+', label: 'Partner Venues' },
              { value: 4200, suffix: '+', label: 'Dates Sponsored' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={stats.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="text-4xl md:text-5xl font-black text-gradient mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-dark-400 font-medium text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" ref={howItWorks.ref} className="py-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-dark-200" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={howItWorks.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-cupid-500 font-bold text-sm tracking-widest uppercase">The Journey</span>
            <h2 className="text-4xl md:text-5xl font-black text-dark-900 mt-3 text-balance">
              Dating, <span className="text-gradient">Reimagined</span>
            </h2>
            <p className="mt-4 text-lg text-dark-500 max-w-xl mx-auto">
              Four steps to a real connection. No shortcuts, no games — just genuine chemistry.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                animate={howItWorks.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                className="group relative"
              >
                {/* Step number */}
                <div className="absolute -top-3 -left-1 w-8 h-8 bg-dark-900 text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                  {i + 1}
                </div>
                <div className="bg-white rounded-3xl p-8 border border-dark-100 card-hover card-glow h-full">
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-dark-900 mb-3">{step.title}</h3>
                  <p className="text-dark-500 leading-relaxed">{step.description}</p>
                </div>
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t-2 border-dashed border-dark-200" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase - Challenge System */}
      <section className="py-24 bg-gradient-to-b from-dark-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-cupid-50/50 rounded-l-[100px] -mr-20" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-cupid-500 font-bold text-sm tracking-widest uppercase">Unique Feature</span>
              <h2 className="text-4xl md:text-5xl font-black text-dark-900 mt-3 leading-tight">
                Earn Your <span className="text-gradient">First Date</span>
              </h2>
              <p className="mt-6 text-lg text-dark-500 leading-relaxed">
                Complete fun challenges, answer thought-provoking questions, and let AI evaluate
                your compatibility. No fake connections — only genuine effort unlocks conversation.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  { icon: Sparkles, text: 'AI-evaluated compatibility challenges', color: 'text-violet-500 bg-violet-50' },
                  { icon: Clock, text: '48-hour chat windows that keep things exciting', color: 'text-blue-500 bg-blue-50' },
                  { icon: Trophy, text: 'Win sponsored dates at partner venues', color: 'text-amber-500 bg-amber-50' },
                  { icon: Gift, text: 'Free coffee, dinner, and experiences', color: 'text-emerald-500 bg-emerald-50' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-dark-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 btn-premium px-6 py-3.5 mt-10 rounded-xl text-sm shadow-lg shadow-cupid-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Try a Challenge — It&apos;s Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Phone mockup */}
            <div className="relative flex justify-center">
              <div className="relative w-[280px] sm:w-[320px]">
                {/* Phone frame */}
                <div className="bg-dark-900 rounded-[40px] p-3 shadow-2xl">
                  <div className="bg-white rounded-[32px] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-dark-900 text-white px-6 py-2 flex justify-between items-center text-xs">
                      <span>9:41</span>
                      <div className="w-20 h-5 bg-dark-800 rounded-full" />
                      <span>100%</span>
                    </div>
                    {/* App screen */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-cupid-500" />
                        <span className="font-bold text-dark-900">Challenge</span>
                      </div>
                      <div className="bg-cupid-50 rounded-2xl p-4 mb-4">
                        <p className="text-sm font-semibold text-cupid-800">
                          &quot;What does a perfect Sunday look like with your partner?&quot;
                        </p>
                      </div>
                      <div className="bg-dark-50 rounded-xl p-3 mb-3">
                        <p className="text-xs text-dark-500 mb-1">Your answer:</p>
                        <p className="text-sm text-dark-700">
                          Lazy morning coffee, farmers market, cooking together, sunset walk...
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold text-emerald-700">Challenge Passed!</p>
                          <p className="text-xs text-emerald-600">Compatibility: 92%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -right-8 top-20 glass rounded-2xl p-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-cupid-500 fill-cupid-500" />
                    <span className="text-sm font-bold text-dark-800">Match!</span>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -left-8 bottom-32 glass rounded-2xl p-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-dark-800">Free Date!</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Venues / Business Section */}
      <section id="venues" ref={business.ref} className="py-24 bg-dark-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-5" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-cupid-500/10 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={business.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-cupid-400 font-bold text-sm tracking-widest uppercase">For Businesses</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-3 text-balance">
              Where Love Meets <span className="text-gradient">Business</span>
            </h2>
            <p className="mt-4 text-lg text-dark-400 max-w-2xl mx-auto">
              Join the CupidMe marketplace. Sponsor dates, attract couples, and grow your venue
              with the most engaged audience in dating.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                title: 'List Your Venue',
                description: 'Create your business profile with photos, menus, and date packages. Get discovered by couples in your area.',
                color: 'from-cupid-400 to-cupid-600',
              },
              {
                icon: Gift,
                title: 'Sponsor Dates',
                description: 'Offer coffee, dinner, or experience packages. Couples earn them through challenges — guaranteed engagement.',
                color: 'from-amber-400 to-amber-600',
              },
              {
                icon: Zap,
                title: 'Track & Grow',
                description: 'Real-time analytics on impressions, bookings, and conversions. See exactly how CupidMe drives foot traffic.',
                color: 'from-emerald-400 to-emerald-600',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                animate={business.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                className="group glass-dark rounded-3xl p-8 card-hover"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="text-dark-400 leading-relaxed">{card.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={business.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center mt-12"
          >
            <Link
              href="/register?role=venue"
              className="inline-flex items-center gap-2 btn-premium px-8 py-4 rounded-2xl text-lg"
            >
              <Store className="w-5 h-5" />
              Register Your Venue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Free Date Feature */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual */}
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="relative">
                {/* Date packages cards */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-4 max-w-sm"
                >
                  {[
                    { icon: Coffee, name: 'Coffee + Bagel Date', venue: 'Bean & Brew, Sea Point', discount: 'FREE', color: 'bg-amber-50 border-amber-200' },
                    { icon: Utensils, name: 'Romantic Dinner', venue: 'La Parada, Bree St', discount: '50% OFF', color: 'bg-cupid-50 border-cupid-200' },
                    { icon: Star, name: 'Luxury Experience', venue: 'The Silo Hotel', discount: 'R500 Credit', color: 'bg-violet-50 border-violet-200' },
                  ].map((pkg, i) => (
                    <motion.div
                      key={pkg.name}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 }}
                      className={`${pkg.color} border rounded-2xl p-5 flex items-center gap-4 card-hover`}
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <pkg.icon className="w-6 h-6 text-dark-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-dark-900">{pkg.name}</h4>
                        <p className="text-sm text-dark-500">{pkg.venue}</p>
                      </div>
                      <span className="text-sm font-extrabold text-cupid-600 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        {pkg.discount}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <span className="text-cupid-500 font-bold text-sm tracking-widest uppercase">Unique to CupidMe</span>
              <h2 className="text-4xl md:text-5xl font-black text-dark-900 mt-3 leading-tight">
                Win <span className="text-gradient">Free Dates</span>
              </h2>
              <p className="mt-6 text-lg text-dark-500 leading-relaxed">
                The world&apos;s first dating platform where your effort earns real experiences.
                Complete challenges, grow your connection level, and unlock sponsored dates
                from partner venues.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: QrCode, label: 'QR Redemption', desc: 'Scan at venue' },
                  { icon: Trophy, label: 'Level Rewards', desc: 'Higher level = better dates' },
                  { icon: Crown, label: 'Premium Perks', desc: 'Exclusive experiences' },
                  { icon: Users, label: 'Couple Rewards', desc: 'Earn together' },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-2xl p-4 border border-dark-100">
                    <item.icon className="w-6 h-6 text-cupid-500 mb-2" />
                    <h4 className="font-bold text-dark-900 text-sm">{item.label}</h4>
                    <p className="text-xs text-dark-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" ref={testimonialSection.ref} className="py-24 bg-gradient-to-b from-cupid-50/50 to-dark-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={testimonialSection.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-cupid-500 font-bold text-sm tracking-widest uppercase">Love Stories</span>
            <h2 className="text-4xl md:text-5xl font-black text-dark-900 mt-3">
              Real Connections, <span className="text-gradient">Real People</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                animate={testimonialSection.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                className="bg-white rounded-3xl p-8 border border-dark-100 card-hover"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-dark-700 leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="font-bold text-dark-900 text-sm">{t.name}</p>
                    <p className="text-xs text-dark-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-dark-900 rounded-[40px] p-12 md:p-20 overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cupid-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cupid-400/10 rounded-full blur-3xl" />

            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow-lg"
              >
                <Heart className="w-10 h-10 text-white fill-white" />
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-black text-white text-balance">
                Ready to earn <span className="text-gradient">real love</span>?
              </h2>
              <p className="text-dark-400 text-lg mt-4 max-w-lg mx-auto">
                Join the community where meaningful connections are built through
                effort, not algorithms.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="btn-premium px-8 py-4 text-lg rounded-2xl inline-flex items-center justify-center gap-2"
                >
                  Create Your Profile
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/register?role=venue"
                  className="px-8 py-4 text-lg font-bold rounded-2xl border-2 border-white/20 text-white hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
                >
                  <Store className="w-5 h-5" />
                  List Your Venue
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-extrabold text-dark-900">
                  Cupid<span className="text-cupid-500">Me</span>
                </span>
              </Link>
              <p className="text-sm text-dark-500 leading-relaxed">
                Where love is earned through effort, not algorithms.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-dark-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-dark-500">
                <li><a href="#how-it-works" className="hover:text-cupid-500 transition-colors">How It Works</a></li>
                <li><Link href="/register" className="hover:text-cupid-500 transition-colors">Sign Up</Link></li>
                <li><Link href="/venues" className="hover:text-cupid-500 transition-colors">Browse Venues</Link></li>
                <li><Link href="/payments" className="hover:text-cupid-500 transition-colors">Premium</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-dark-900 mb-4">For Business</h4>
              <ul className="space-y-2 text-sm text-dark-500">
                <li><Link href="/register?role=venue" className="hover:text-cupid-500 transition-colors">List Your Venue</Link></li>
                <li><Link href="/dashboard" className="hover:text-cupid-500 transition-colors">Business Dashboard</Link></li>
                <li><a href="#" className="hover:text-cupid-500 transition-colors">Advertising</a></li>
                <li><a href="#" className="hover:text-cupid-500 transition-colors">Partner Program</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-dark-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-dark-500">
                <li><a href="#" className="hover:text-cupid-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-cupid-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-cupid-500 transition-colors">POPIA Compliance</a></li>
                <li><a href="#" className="hover:text-cupid-500 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-dark-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-dark-400">&copy; 2026 CupidMe.org. All rights reserved.</p>
            <p className="text-sm text-dark-400">Made with <Heart className="w-3.5 h-3.5 text-cupid-500 fill-cupid-500 inline" /> in South Africa</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
