'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

interface ProfileGateProps {
  children: React.ReactNode;
}

/**
 * Cosmetic-only: calculates a visual completion percentage for the blocker screen.
 * NOT used for the actual gate decision — that's solely `profile_complete` from the server.
 */
function calculateCompletion(profile: any): { percent: number; missing: string[] } {
  const missing: string[] = [];
  let score = 0;
  const total = 5;

  if (profile?.display_name) score++; else missing.push('Name');
  if (profile?.date_of_birth) score++; else missing.push('Birthday');
  if (profile?.city) score++; else missing.push('Location');
  if (profile?.bio) score++; else missing.push('Bio');
  if (profile?.photos?.length > 0 || profile?.user_photos?.length > 0) score++; else missing.push('Photo');

  return { percent: Math.round((score / total) * 100), missing };
}

/**
 * ProfileGate — wraps all (main) layout routes.
 *
 * Logic (in order):
 *   1. Exempt paths → render immediately, no checks
 *   2. Not authenticated → redirect to /login
 *   3. profileComplete === true in store → render immediately (FAST PATH — no API call)
 *   4. profileComplete unknown (null) → fetch from API, then decide
 *   5. profileComplete === false → show "Complete Profile" blocker
 *
 * The fast path (#3) is what prevents the redirect loop after onboarding.
 * handleComplete sets profileComplete=true in the store BEFORE navigating to /discover,
 * so ProfileGate sees it instantly without needing an API roundtrip.
 */
export function ProfileGate({ children }: ProfileGateProps) {
  const [profileState, setProfileState] = useState<'loading' | 'complete' | 'incomplete'>('loading');
  const [completion, setCompletion] = useState({ percent: 0, missing: [] as string[] });
  const token = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileComplete = useAuthStore((s) => s.profileComplete);
  const setProfileComplete = useAuthStore((s) => s.setProfileComplete);
  const pathname = usePathname();
  const router = useRouter();

  const exempt = ['/profile/edit', '/profile', '/settings'];
  const isExempt = exempt.some((p) => pathname.startsWith(p));

  useEffect(() => {
    // ── 1. Exempt paths: render immediately ──
    if (isExempt) {
      setProfileState('complete');
      return;
    }

    // ── 2. Not authenticated: redirect to /login ──
    if (!isAuthenticated || !token) {
      router.replace('/login');
      setProfileState('complete');
      return;
    }

    // ── 3. FAST PATH: store already says complete → render immediately ──
    // This is set by handleComplete() and handlePostLoginRedirect() BEFORE navigation.
    // No API call needed — prevents the redirect-loop race condition.
    if (profileComplete === true) {
      setProfileState('complete');
      return;
    }

    // ── 4. Store says false or null → verify with the server ──
    async function check() {
      try {
        const res = await api.get<any>('/api/users/me', token!);
        const profile = res.data;

        if (profile?.profile_complete === true) {
          setProfileComplete(true);
          setProfileState('complete');
        } else {
          setProfileComplete(false);
          setCompletion(calculateCompletion(profile));
          setProfileState('incomplete');
        }
      } catch {
        setProfileComplete(false);
        setProfileState('incomplete');
      }
    }
    check();
  }, [token, isAuthenticated, isExempt, profileComplete, router, setProfileComplete]);

  if (profileState === 'loading') return null;

  if (profileState === 'incomplete' && !isExempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm"
        >
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
