'use client';

import Link from 'next/link';
import { Heart, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/stores/notificationStore';
import { Avatar } from '@/components/ui/Avatar';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-dark-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-7 h-7 text-cupid-500 fill-cupid-500" />
          <span className="text-xl font-bold text-dark-900">
            Cupid<span className="text-cupid-500">Me</span>
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link href="/discover" className="text-sm font-medium text-dark-600 hover:text-cupid-500">
              Discover
            </Link>
            <Link href="/matches" className="text-sm font-medium text-dark-600 hover:text-cupid-500">
              Matches
            </Link>
            <Link href="/venues" className="text-sm font-medium text-dark-600 hover:text-cupid-500">
              Venues
            </Link>
            <button className="relative p-2 hover:bg-dark-50 rounded-xl">
              <Bell className="w-5 h-5 text-dark-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cupid-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <Link href="/profile">
              <Avatar alt="Me" size="sm" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-dark-600 hover:text-cupid-500">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-cupid-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-cupid-600 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
