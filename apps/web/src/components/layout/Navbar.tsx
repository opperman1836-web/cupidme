'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bell, Sun, Moon, User, Settings, LogOut, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/components/ThemeProvider';
import { Avatar } from '@/components/ui/Avatar';

/**
 * Avatar dropdown menu — Tinder-style.
 * Click the avatar → opens a dropdown with My Profile / Settings / Logout.
 * NEVER a direct link to /profile (prevents the "Complete Profile" loop).
 */
function AvatarDropdown({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Close on route-change escape key
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full transition-all hover:ring-2 hover:ring-cupid-300 focus:outline-none focus:ring-2 focus:ring-cupid-400"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <Avatar alt="Me" size="sm" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-dark-100 dark:border-dark-700 overflow-hidden z-50"
          >
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-dark-800 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
            >
              <User className="w-5 h-5 text-cupid-500" />
              <span className="text-sm font-semibold">My Profile</span>
            </Link>

            <Link
              href="/payments"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-dark-800 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
            >
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-semibold">Premium</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-dark-800 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
            >
              <Settings className="w-5 h-5 text-dark-500" />
              <span className="text-sm font-semibold">Settings</span>
            </Link>

            <div className="border-t border-dark-100 dark:border-dark-700" />

            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-semibold">Log out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-dark-500" />
              ) : (
                <Sun className="w-5 h-5 text-dark-400" />
              )}
            </button>

            <button className="relative p-2 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-xl transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5 text-dark-500 dark:text-dark-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cupid-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Avatar dropdown — Tinder-style, not a direct redirect */}
            <AvatarDropdown onLogout={logout} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 hover:bg-dark-50 dark:hover:bg-dark-800 rounded-xl transition-colors"
              aria-label="Toggle theme"
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
