'use client';

import Link from 'next/link';
import { Heart, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/components/ThemeProvider';
import { Avatar } from '@/components/ui/Avatar';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-30 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-dark-100 dark:border-dark-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-lg flex items-center justify-center">
            <Heart className="w-4.5 h-4.5 text-white fill-white" />
          </div>
          <span className="text-xl font-extrabold text-dark-900 dark:text-white">
            Cupid<span className="text-cupid-500">Me</span>
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1">
              <Link href="/discover" className="px-3 py-2 text-sm font-medium text-dark-600 dark:text-dark-300 hover:text-cupid-500 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800 transition-all">
                Discover
              </Link>
              <Link href="/matches" className="px-3 py-2 text-sm font-medium text-dark-600 dark:text-dark-300 hover:text-cupid-500 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800 transition-all">
                Matches
              </Link>
              <Link href="/duel/invite" className="px-3 py-2 text-sm font-medium text-dark-600 dark:text-dark-300 hover:text-cupid-500 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800 transition-all">
                Duel
              </Link>
              <Link href="/venues" className="px-3 py-2 text-sm font-medium text-dark-600 dark:text-dark-300 hover:text-cupid-500 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800 transition-all">
                Venues
              </Link>
            </div>

            <button
              onClick={toggle}
              className="p-2 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-xl transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-dark-500" />
              ) : (
                <Sun className="w-5 h-5 text-dark-400" />
              )}
            </button>

            <button className="relative p-2 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-dark-500 dark:text-dark-400" />
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
            <button
              onClick={toggle}
              className="p-2 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-xl transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-dark-500" />
              ) : (
                <Sun className="w-5 h-5 text-dark-400" />
              )}
            </button>
            <Link href="/login" className="text-sm font-semibold text-dark-600 dark:text-dark-300 hover:text-cupid-500">
              Login
            </Link>
            <Link
              href="/register"
              className="btn-premium px-4 py-2 rounded-xl text-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
