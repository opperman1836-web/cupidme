'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Swords, Heart, Trophy, Zap, ArrowRight, Star,
  Sparkles, Shield, Lock, Mail, User, Eye, EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';
import { Confetti } from '@/components/duel/Confetti';

type Phase = 'loading' | 'preview' | 'signup' | 'accepting' | 'reward';

export default function ChallengePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const setTokens = useAuthStore((s) => s.setTokens);
  const addToast = useToastStore((s) => s.addToast);

  const [phase, setPhase] = useState<Phase>('loading');
  const [preview, setPreview] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [reward, setReward] = useState<any>(null);

  // Signup form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load invite preview
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>(`/api/invites/preview/${code}`);
        setPreview(res.data);

        if (res.data.status === 'accepted') {
          addToast('This invite has already been accepted', 'info');
        }

        setPhase('preview');
      } catch {
        addToast('Invalid or expired invite link', 'error');
        router.push('/');
      }
    }
    load();
  }, [code, addToast, router]);

  function handleAcceptClick() {
    if (token && userId) {
      // Already logged in — accept directly
      acceptAuth();
    } else {
      setPhase('signup');
    }
  }

  async function acceptAuth() {
    setPhase('accepting');
    try {
      const res = await api.post<any>(`/api/invites/${code}/accept-auth`, {}, token!);
      setReward(res.data.reward);
      setShowConfetti(true);
      setPhase('reward');
    } catch (err: any) {
      addToast(err.message || 'Failed to accept invite', 'error');
      setPhase('preview');
    }
  }

  async function handleSignupAndAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !displayName) {
      addToast('All fields are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<any>(`/api/invites/${code}/accept`, {
        email,
        password,
        display_name: displayName,
      });

      const { access_token, user_id, reward: r } = res.data;

      if (access_token && user_id) {
        setTokens(access_token, '', user_id);
      }

      setReward(r);
      setShowConfetti(true);
      setPhase('reward');
    } catch (err: any) {
      addToast(err.message || 'Failed to accept invite', 'error');
    }
    setSubmitting(false);
  }

  const compatibility = Math.round(preview?.compatibility_score || 0);
  const inviterScore = preview?.inviter_score || 0;

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cupid-50 via-white to-cupid-100">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Swords className="w-16 h-16 text-cupid-500" />
        </motion.div>
      </div>
    );
  }

  // ── REWARD SCREEN ──
  if (phase === 'reward') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cupid-50 via-white to-cupid-100 px-4">
        <Confetti trigger={showConfetti} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center overflow-hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
              className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-3xl font-black text-dark-900 mb-2">Challenge Accepted!</h1>
            <p className="text-dark-500 mb-6">You earned a reward for joining</p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-5 mb-6 border border-emerald-200"
            >
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-8 h-8 text-emerald-500" />
                <div className="text-left">
                  <p className="text-xl font-black text-emerald-700">+1 Free Duel Credit!</p>
                  <p className="text-sm text-emerald-600">{reward?.message || 'Play your first duel free'}</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-3">
              <Button
                className="w-full !py-4 !text-lg"
                onClick={() => router.push('/duel/invite')}
              >
                <Swords className="w-5 h-5 mr-2" />
                Start a Duel Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-dark-400">
                Want more duels?{' '}
                <Link href="/payments" className="text-cupid-500 font-semibold hover:underline">
                  Get credits
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-cupid-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-20 w-60 h-60 bg-cupid-400/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-extrabold text-white">
              Cupid<span className="text-cupid-400">Me</span>
            </span>
          </Link>
        </motion.div>

        {/* ── PREVIEW PHASE ── */}
        {phase === 'preview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Challenge card */}
            <Card className="glass-dark text-center mb-6 overflow-hidden border-white/10">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-glow"
              >
                <Swords className="w-10 h-10 text-white" />
              </motion.div>

              <p className="text-cupid-400 text-sm font-bold tracking-widest uppercase mb-2">
                Duel Challenge
              </p>

              <h1 className="text-2xl font-black text-white mb-2">
                {preview?.inviter_name} challenges you!
              </h1>

              <p className="text-dark-400 text-sm mb-6">
                Think you can beat their chemistry?
              </p>

              {/* Score teaser */}
              {inviterScore > 0 && (
                <div className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/10">
                  <div className="flex items-center justify-center gap-3">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-white font-black text-lg">
                        {preview?.inviter_name} scored {inviterScore} pts
                      </p>
                      <p className="text-dark-400 text-xs">Can you beat them?</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Duel type badge */}
              {preview?.duel_type && (
                <Badge className="bg-white/10 text-white border-white/20 mb-5">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {preview.duel_type.replace('_', ' ')} duel
                </Badge>
              )}

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 text-xs text-dark-500 mb-6">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Free to play
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" /> AI-powered
                </span>
              </div>

              <Button
                className="w-full !py-4 !text-lg !rounded-2xl"
                onClick={handleAcceptClick}
              >
                <Swords className="w-5 h-5 mr-2" />
                Accept Challenge
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Card>

            {/* Login link */}
            <p className="text-center text-dark-500 text-sm">
              Already have an account?{' '}
              <Link href={`/login?redirect=/duel/challenge/${code}`} className="text-cupid-400 font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </motion.div>
        )}

        {/* ── SIGNUP PHASE ── */}
        {(phase === 'signup' || phase === 'accepting') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-dark border-white/10">
              <div className="text-center mb-6">
                <Swords className="w-10 h-10 text-cupid-500 mx-auto mb-3" />
                <h2 className="text-xl font-black text-white">Quick Sign Up</h2>
                <p className="text-dark-400 text-sm mt-1">
                  30 seconds to accept the challenge
                </p>
              </div>

              <form onSubmit={handleSignupAndAccept} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-300 mb-2">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="What should we call you?"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-dark-500 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-dark-500 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-dark-500 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-500/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full !py-4 !text-lg !rounded-xl"
                  loading={submitting || phase === 'accepting'}
                >
                  Accept Challenge
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setPhase('preview')}
                  className="text-sm text-dark-500 hover:text-dark-300"
                >
                  Go back
                </button>
              </div>
            </Card>

            <p className="text-center text-dark-600 text-xs mt-4">
              By signing up you agree to our{' '}
              <a href="#" className="text-cupid-400 hover:underline">Terms</a> and{' '}
              <a href="#" className="text-cupid-400 hover:underline">Privacy Policy</a>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
