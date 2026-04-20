'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

/**
 * Auth layout — wraps /login and /register.
 * If the user is already authenticated, redirect them away.
 *   - profile_complete === true → /discover
 *   - profile_complete === false/null → /profile/edit (onboarding)
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profileComplete = useAuthStore((s) => s.profileComplete);

  useEffect(() => {
    if (isAuthenticated) {
      if (profileComplete === true) {
        router.replace('/discover');
      } else {
        // null or false — either go check or go to onboarding
        router.replace('/profile/edit');
      }
    }
  }, [isAuthenticated, profileComplete, router]);

  return (
    <div className="min-h-screen flex bg-dark-50 dark:bg-dark-950">
      {/* Left panel - branding (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-hero-pattern opacity-5" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-cupid-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-60 h-60 bg-cupid-400/10 rounded-full blur-3xl" />

        <div className="relative text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow-lg">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Where Love Is{' '}
            <span className="text-gradient">Earned</span>
          </h1>
          <p className="text-dark-400 mt-4 text-lg leading-relaxed">
            No mindless swiping. Prove you care through challenges,
            build real connections, and unlock sponsored dates at amazing venues.
          </p>
          <div className="mt-10 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-cupid-500/10 border border-cupid-400/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-sm text-cupid-100">
              We are a new dating platform — be among the first to connect.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-10 h-10 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-extrabold text-dark-900 dark:text-white">
            Cupid<span className="text-cupid-500">Me</span>
          </span>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
