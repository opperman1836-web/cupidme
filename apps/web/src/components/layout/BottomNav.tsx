'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, Heart, Swords, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/duel/invite', icon: Swords, label: 'Duel' },
  { href: '/venues', icon: MapPin, label: 'Venues' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-dark-900/90 backdrop-blur-xl border-t border-dark-100 dark:border-dark-800 pb-safe md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors',
                active ? 'text-cupid-500' : 'text-dark-400 dark:text-dark-500'
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottomnav-indicator"
                  className="absolute -top-px inset-x-1 h-[3px] bg-cupid-500 rounded-b-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="w-5 h-5" fill={active ? 'currentColor' : 'none'} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
