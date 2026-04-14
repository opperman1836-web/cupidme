import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-dark-50">
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
          <div className="flex items-center justify-center gap-8 mt-10 text-dark-500">
            <div className="text-center">
              <p className="text-2xl font-black text-white">50K+</p>
              <p className="text-xs">Active Users</p>
            </div>
            <div className="w-px h-10 bg-dark-700" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">12K+</p>
              <p className="text-xs">Matches Made</p>
            </div>
            <div className="w-px h-10 bg-dark-700" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">850+</p>
              <p className="text-xs">Partner Venues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-10 h-10 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-extrabold text-dark-900">
            Cupid<span className="text-cupid-500">Me</span>
          </span>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
