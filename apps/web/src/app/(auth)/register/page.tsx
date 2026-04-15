'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight, Sparkles, Shield, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';
import { analytics } from '@/lib/analytics';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const { register } = useAuth();
  const addToast = useToastStore((s) => s.addToast);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    setLoading(true);
    setStatusMsg('Creating your account...');
    analytics.track('onboarding_started', { method: 'email' });
    try {
      await register(email, password);
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      // Show user-friendly messages
      if (msg.includes('starting up') || msg.includes('Cannot reach')) {
        setStatusMsg('Server is waking up — please wait...');
        // Auto-retry after 3 seconds
        setTimeout(async () => {
          try {
            await register(email, password);
          } catch (retryErr: any) {
            addToast(retryErr.message || 'Registration failed. Please try again.', 'error');
            setStatusMsg('');
            setLoading(false);
          }
        }, 3000);
        return;
      }
      addToast(msg, 'error');
      setStatusMsg('');
    } finally {
      if (!statusMsg.includes('waking')) {
        setLoading(false);
        setStatusMsg('');
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-3xl shadow-xl border border-dark-100 p-8">
        {/* Motivational header */}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-cupid-500" />
          <span className="text-xs font-bold text-cupid-500 uppercase tracking-wider">Free to join</span>
        </div>
        <h1 className="text-3xl font-black text-dark-900 mb-1">Your First Challenge Awaits</h1>
        <p className="text-dark-500 mb-6">Join 50,000+ people finding real connections</p>

        {/* Minimal form — just email + password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-dark-200 bg-white text-dark-900 placeholder:text-dark-400 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all text-base disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (8+ characters)"
                required
                minLength={8}
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-dark-200 bg-white text-dark-900 placeholder:text-dark-400 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all text-base disabled:opacity-60"
              />
            </div>
          </div>

          <Button type="submit" className="w-full !py-4 !rounded-2xl !text-base font-bold" loading={loading} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {statusMsg || 'Creating account...'}
              </span>
            ) : (
              <>
                Start My First Challenge
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Status message for cold start */}
        {statusMsg && loading && (
          <p className="mt-3 text-center text-sm text-dark-500 animate-pulse">
            {statusMsg}
          </p>
        )}

        {/* Trust signals */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-dark-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            AI-verified
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            Secure
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-cupid-500" />
            50K+ members
          </span>
        </div>

        <p className="mt-4 text-center text-[11px] text-dark-400">
          By joining, you agree to our{' '}
          <a href="#" className="text-cupid-500 hover:underline">Terms</a> and{' '}
          <a href="#" className="text-cupid-500 hover:underline">Privacy Policy</a>
        </p>

        <div className="mt-5 text-center">
          <p className="text-sm text-dark-500">
            Already have an account?{' '}
            <Link href="/login" className="text-cupid-500 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
