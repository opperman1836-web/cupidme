'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const addToast = useToastStore((s) => s.addToast);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      addToast(err.message || 'Login failed', 'error');
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
        <h1 className="text-3xl font-black text-dark-900 mb-1">Welcome Back</h1>
        <p className="text-dark-500 mb-8">Sign in to continue your journey</p>

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
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-dark-200 bg-white text-dark-900 placeholder:text-dark-400 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-dark-700">Password</label>
              <a href="#" className="text-xs text-cupid-500 hover:underline font-medium">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-dark-200 bg-white text-dark-900 placeholder:text-dark-400 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <Button type="submit" className="w-full !py-3.5 !rounded-2xl !text-base" loading={loading}>
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-dark-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-cupid-500 font-bold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
