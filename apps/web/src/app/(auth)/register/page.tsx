'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/components/ui/Toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const addToast = useToastStore((s) => s.addToast);

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
    <Card>
      <h1 className="text-2xl font-bold text-dark-900 mb-2">Create Account</h1>
      <p className="text-dark-500 mb-6">Start your journey to meaningful connections.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+27 XX XXX XXXX"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-dark-500">
        Already have an account?{' '}
        <Link href="/login" className="text-cupid-500 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
