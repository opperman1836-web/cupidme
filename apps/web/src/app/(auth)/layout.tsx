import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cupid-50 via-white to-cupid-100 px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Heart className="w-8 h-8 text-cupid-500 fill-cupid-500" />
        <span className="text-2xl font-bold text-dark-900">
          Cupid<span className="text-cupid-500">Me</span>
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
