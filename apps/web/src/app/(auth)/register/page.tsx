'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const addToast = useToastStore((s) => s.addToast);

  const passwordStrength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length >= 4 ? 1 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, phone || undefined);
    } catch (err: any) {
      addToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-3xl shadow-xl border border-dark-100 p-8">
        <h1 className="text-3xl font-black text-dark-900 mb-1">Create Account</h1>
        <p className="text-dark-500 mb-8">Start your journey to meaningful connections</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-dark-200 bg-dark-50 focus:bg-white focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Phone (optional)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 XX XXX XXXX"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-dark-200 bg-dark-50 focus:bg-white focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-dark-200 bg-dark-50 focus:bg-white focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all"
              />
            </div>
            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="flex gap-1 mt-2">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      level <= passwordStrength
                        ? passwordStrength === 1 ? 'bg-red-400' : passwordStrength === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                        : 'bg-dark-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-dark-200 bg-dark-50 focus:bg-white focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all"
              />
              {confirmPassword && password === confirmPassword && (
                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              )}
            </div>
          </div>

          <Button type="submit" className="w-full !py-3.5 !rounded-2xl !text-base" loading={loading}>
            Create Account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-dark-400">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-cupid-500 hover:underline">Terms</a> and{' '}
          <a href="#" className="text-cupid-500 hover:underline">Privacy Policy</a>
        </p>

        <div className="mt-6 text-center">
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
