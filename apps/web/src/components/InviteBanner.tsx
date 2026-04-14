'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Share2, Users, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { analytics } from '@/lib/analytics';

interface InviteBannerProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function InviteBanner({ variant = 'full', className = '' }: InviteBannerProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/register` : 'https://cupidme.app';
  const shareText = 'Join me on CupidMe — the dating app where you duel for love! 💕🎮';

  async function handleShare() {
    analytics.track('invite_shared', { method: 'native' });
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join CupidMe', text: shareText, url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  }

  async function handleCopy() {
    analytics.track('invite_shared', { method: 'copy' });
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  }

  async function handleWhatsApp() {
    analytics.track('invite_shared', { method: 'whatsapp' });
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  }

  if (variant === 'compact') {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleShare}
        className={`w-full flex items-center gap-3 p-4 bg-gradient-to-r from-cupid-50 to-purple-50 dark:from-cupid-900/20 dark:to-purple-900/20 rounded-2xl border border-cupid-100 dark:border-cupid-800/30 hover:shadow-md transition-all ${className}`}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-cupid-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-dark-800 dark:text-dark-200">Invite friends, earn credits</p>
          <p className="text-xs text-dark-500">Both of you get a free duel credit!</p>
        </div>
        <ChevronRight className="w-5 h-5 text-dark-300 flex-shrink-0" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-cupid-50 via-white to-purple-50 dark:from-cupid-900/20 dark:via-dark-900 dark:to-purple-900/20 rounded-2xl border border-cupid-100 dark:border-cupid-800/30 p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-cupid-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cupid-500/20">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-dark-900 dark:text-white">Invite Friends</h3>
          <p className="text-xs text-dark-500">Both of you earn a free duel credit!</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex-1 text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        <Button
          size="sm"
          onClick={handleWhatsApp}
          className="flex-1 text-xs bg-emerald-500 hover:bg-emerald-600"
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.61l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.326-.699-6.046-1.89l-.422-.304-2.645.887.887-2.645-.304-.422A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          WhatsApp
        </Button>
        <Button
          size="sm"
          onClick={handleShare}
          className="flex-1 text-xs"
        >
          <Share2 className="w-3.5 h-3.5 mr-1" /> Share
        </Button>
      </div>
    </motion.div>
  );
}
