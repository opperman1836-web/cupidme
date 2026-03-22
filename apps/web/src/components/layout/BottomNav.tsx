'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, MessageCircle, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/venues', icon: MapPin, label: 'Venues' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-dark-100 pb-safe md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1',
                active ? 'text-cupid-500' : 'text-dark-400'
              )}
            >
              <Icon className="w-5 h-5" fill={active ? 'currentColor' : 'none'} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
