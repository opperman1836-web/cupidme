'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Share2, Copy, Check, MessageCircle, Heart,
  ExternalLink, Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/components/ui/Toast';

interface ShareCardProps {
  duelId: string;
  inviterName: string;
  opponentName: string;
  compatibility: number;
  inviteCode?: string;
}

export function ShareCard({ duelId, inviterName, opponentName, compatibility, inviteCode: existingCode }: ShareCardProps) {
  const [inviteCode, setInviteCode] = useState(existingCode || '');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  const shareUrl = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/duel/challenge/${inviteCode}`
    : '';

  const shareText = compatibility >= 70
    ? `${inviterName} & ${opponentName} scored ${compatibility}% chemistry on CupidMe! Think you can beat that? 💘`
    : `I just played a Cupid Duel on CupidMe! Can you beat my score? 🎯`;

  async function generateLink() {
    if (inviteCode) return;
    setCreating(true);
    try {
      const res = await api.post<any>('/api/invites/create', { duel_id: duelId }, token!);
      setInviteCode(res.data.invite_code);
    } catch (err: any) {
      addToast(err.message || 'Failed to create share link', 'error');
    }
    setCreating(false);
  }

  async function trackAndShare(platform: string) {
    if (!inviteCode) await generateLink();

    try {
      await api.post('/api/invites/track-share', {
        duel_id: duelId,
        platform,
      }, token!);
    } catch { /* tracking is best-effort */ }
  }

  async function handleCopy() {
    if (!inviteCode) await generateLink();
    if (!shareUrl) return;

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    await trackAndShare('copy');
    addToast('Link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (!inviteCode) await generateLink();
    await trackAndShare('native');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CupidMe Duel Challenge',
          text: shareText,
          url: shareUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  }

  async function handleWhatsApp() {
    if (!inviteCode) await generateLink();
    await trackAndShare('whatsapp');
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    window.open(url, '_blank');
  }

  async function handleTwitter() {
    if (!inviteCode) await generateLink();
    await trackAndShare('twitter');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-cupid-500 to-cupid-700 text-white border-0">
        {/* Preview card mockup */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
              {inviterName.charAt(0)}
            </div>
            <Heart className="w-6 h-6 text-white fill-white" />
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
              {opponentName.charAt(0)}
            </div>
          </div>
          <p className="text-center text-3xl font-black">{compatibility}% Match</p>
          <p className="text-center text-white/70 text-sm mt-1 italic">
            {compatibility >= 70
              ? '"We might actually go on a date…"'
              : '"Can you beat our chemistry?"'}
          </p>
        </div>

        {/* Share actions */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-lg font-bold">Share Your Result</h3>
          </div>
          <p className="text-white/70 text-sm">
            Challenge your friends — both of you earn a free duel credit!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-3 bg-white/15 hover:bg-white/25 rounded-xl transition-colors text-sm font-semibold"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 py-3 bg-white/15 hover:bg-white/25 rounded-xl transition-colors text-sm font-semibold"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 py-3 bg-emerald-500/80 hover:bg-emerald-500 rounded-xl transition-colors text-sm font-semibold"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={handleTwitter}
            className="flex items-center justify-center gap-2 py-3 bg-sky-500/80 hover:bg-sky-500 rounded-xl transition-colors text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            X / Twitter
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
