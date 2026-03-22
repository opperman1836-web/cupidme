'use client';

import { useState, useEffect } from 'react';
import { Camera, Settings, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const { logout } = useAuth();
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/users/me', token!);
        setProfile(res.data);
      } catch {
        addToast('Failed to load profile', 'error');
      }
      setLoading(false);
    }
    if (token) load();
  }, [token, addToast]);

  if (loading) return <div className="text-center py-20 text-dark-400">Loading profile...</div>;

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-xl font-bold text-dark-900 mb-4">Complete Your Profile</h2>
        <p className="text-dark-500 mb-6">Set up your profile to start discovering matches.</p>
        <Link href="/profile/edit">
          <Button>Create Profile</Button>
        </Link>
      </div>
    );
  }

  const primaryPhoto = profile.user_photos?.find((p: any) => p.is_primary);

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-900">Profile</h1>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm"><Settings className="w-5 h-5" /></Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <Card className="text-center">
        <div className="relative inline-block">
          <Avatar src={primaryPhoto?.url} alt={profile.display_name} size="xl" />
          <button className="absolute bottom-0 right-0 w-10 h-10 bg-cupid-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-2xl font-bold text-dark-900 mt-4">{profile.display_name}</h2>
        <p className="text-dark-500">{profile.city}</p>
        {profile.bio && <p className="text-dark-600 mt-3">{profile.bio}</p>}

        <div className="flex gap-2 justify-center mt-4 flex-wrap">
          {profile.user_interests?.map((interest: any) => (
            <Badge key={interest.id}>{interest.interest_tag}</Badge>
          ))}
        </div>

        <Link href="/profile/edit" className="block mt-6">
          <Button variant="outline" className="w-full">Edit Profile</Button>
        </Link>
      </Card>
    </div>
  );
}
