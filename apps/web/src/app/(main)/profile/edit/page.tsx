'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/components/ui/Toast';

export default function EditProfilePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    date_of_birth: '',
    gender: 'male',
    gender_preference: 'everyone',
    city: '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/users/profile', form, token!);
      addToast('Profile saved!', 'success');
      router.push('/discover');
    } catch (err: any) {
      addToast(err.message || 'Failed to save', 'error');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Create Your Profile</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Display Name" value={form.display_name} onChange={(e) => update('display_name', e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              placeholder="Tell people about yourself..."
              className="w-full rounded-xl border border-dark-200 px-4 py-3 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-200 focus:outline-none resize-none h-24"
              maxLength={500}
            />
          </div>
          <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              className="w-full rounded-xl border border-dark-200 px-4 py-3 focus:border-cupid-500 focus:outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">Interested In</label>
            <select
              value={form.gender_preference}
              onChange={(e) => update('gender_preference', e.target.value)}
              className="w-full rounded-xl border border-dark-200 px-4 py-3 focus:border-cupid-500 focus:outline-none"
            >
              <option value="everyone">Everyone</option>
              <option value="male">Men</option>
              <option value="female">Women</option>
              <option value="non_binary">Non-binary</option>
            </select>
          </div>
          <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Cape Town" required />
          <Button type="submit" className="w-full" loading={loading}>
            Save Profile
          </Button>
        </form>
      </Card>
    </div>
  );
}
