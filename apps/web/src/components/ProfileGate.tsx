'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, User, ChevronRight, Camera, Pen, Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

interface ProfileGateProps {
  children: React.ReactNode;
}

function calculateCompletion(profile: any): { percent: number; missing: string[] } {
  const missing: string[] = [];
  let score = 0;
  const total = 5;

  if (profile?.display_name) score++; else missing.push('Name');
  if (profile?.date_of_birth) score++; else missing.push('Birthday');
  if (profile?.city) score++; else missing.push('Location');
  if (profile?.bio) score++; else missing.push('Bio');
  if (profile?.user_photos?.length > 0) score++; else missing.push('Photo');

  return { percent: Math.round((score / total) * 100), missing };
}

export function ProfileGate({ children }: ProfileGateProps) {
  const [profileState, setProfileState] = useState<'loading' | 'complete' | 'incomplete'>('loading');
  const [completion, setCompletion] = useState({ percent: 0, missing: [] as string[] });
  const token = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();
  const router = useRouter();

  const exempt = ['/profile/edit', '/profile', '/settings', '/login', '/register'];
  const isExempt = exempt.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isAuthenticated || !token || isExempt) {
      setProfileState('complete');
      return;
    }

    async function check() {
      try {
        const res = await api.get<any>('/api/users/me', token!);
        const profile = res.data;
        const comp = calculateCompletion(profile);
        setCompletion(comp);

        if (!profile || !profile.display_name || !profile.profile_complete) {
          setProfileState('incomplete');
        } else {
          setProfileState('complete');
        }
      } catch {
        setProfileState('complete');
      }
    }
    check();
  }, [token, isAuthenticated, isExempt]);

  if (profileState === 'loading') return null;

  if (profileState === 'incomplete' && !isExempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm"
        >
          {/* Progress ring */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-dark-100 dark:stroke-dark-800" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                strokeLinecap="round"
                className="stroke-cupid-500"
                strokeDasharray={264}
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * completion.percent) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-cupid-500">{completion.percent}%</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-dark-800 dark:text-dark-200 mb-2">
            Almost there!
          </h2>
          <p className="text-dark-500 mb-4">
            Complete your profile to start meeting people.
          </p>

          {completion.missing.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {completion.missing.map((item) => (
                <span key={item} className="px-3 py-1 bg-dark-100 dark:bg-dark-800 text-dark-500 text-xs font-medium rounded-full">
                  + {item}
                </span>
              ))}
            </div>
          )}

          <Button onClick={() => router.push('/profile/edit')} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" /> Complete Profile
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
