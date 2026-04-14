'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Swords, Zap, Sparkles, Clock,
  ChevronRight, Shield, MapPin, Crown, Flame,
} from 'lucide-react';
import { api } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';
import { formatTimeLeft } from '@/lib/utils';
import { InviteBanner } from '@/components/InviteBanner';

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'active'>('all');
  const [startingDuel, setStartingDuel] = useState<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/matches', token!);
        setMatches(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load(); else setLoading(false);
  }, [token]);

  async function handleStartDuel(match: any) {
    const opponentId = match.other_user?.id;
    if (!opponentId) { addToast('Cannot start duel', 'error'); return; }
    setStartingDuel(match.id);
    try {
      const res = await api.post<any>('/api/duels/create', {
        opponent_id: opponentId,
        match_id: match.id,
        type: 'compatibility',
      }, token!);

      if (res.data?.id) {
        addToast('Duel created! Get ready...', 'success');
        analytics.track('duel_started', { match_id: match.id, opponent_id: opponentId });
        analytics.trackFunnel('duel_started');
        router.push(`/duel/play/${res.data.id}`);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to start duel', 'error');
    }
    setStartingDuel(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Heart className="w-12 h-12 text-cupid-400" />
        </motion.div>
      </div>
    );
  }

  // Split into new matches (top row) and all matches (list)
  const newMatches = matches.filter((m) =>
    ['pending_challenge', 'challenge_active'].includes(m.status)
  );
  const activeMatches = matches.filter((m) => m.status === 'unlocked');

  const filteredMatches = filter === 'new'
    ? newMatches
    : filter === 'active'
      ? activeMatches
      : matches;

  const statusConfig: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'danger'; icon: any }> = {
    pending_challenge: { label: 'New', variant: 'warning', icon: Sparkles },
    challenge_active: { label: 'Challenge', variant: 'info', icon: Zap },
    unlocked: { label: 'Unlocked', variant: 'success', icon: MessageCircle },
    expired: { label: 'Expired', variant: 'danger', icon: Clock },
    unmatched: { label: 'Unmatched', variant: 'danger', icon: Heart },
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-dark-900 dark:text-white">Matches</h1>
          <p className="text-dark-500 text-sm mt-1">
            {matches.length} {matches.length === 1 ? 'connection' : 'connections'}
          </p>
        </div>
        <Link href="/discover">
          <Button size="sm">
            <Flame className="w-4 h-4 mr-1" /> Discover
          </Button>
        </Link>
      </div>

      {/* New Matches Row (horizontal scroll) */}
      {newMatches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-dark-600 dark:text-dark-400 uppercase tracking-wider mb-3">
            New Matches
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {newMatches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0"
              >
                <button
                  onClick={() => handleStartDuel(match)}
                  disabled={startingDuel === match.id}
                  className="relative group"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-cupid-400 ring-offset-2 dark:ring-offset-dark-900 shadow-md group-hover:ring-cupid-500 transition-all">
                    {match.other_user?.primary_photo_url ? (
                      <img
                        src={match.other_user.primary_photo_url}
                        alt={match.other_user.display_name || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cupid-100 to-cupid-200 dark:from-cupid-900/40 dark:to-cupid-800/40 flex items-center justify-center">
                        <span className="text-2xl font-black text-cupid-500">
                          {(match.other_user?.display_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-cupid-500 rounded-full flex items-center justify-center shadow-sm">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-dark-700 dark:text-dark-300 mt-1.5 text-center truncate w-20">
                    {match.other_user?.display_name || 'Someone'}
                  </p>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-dark-100 dark:bg-dark-800 rounded-2xl p-1 mb-5">
        {([
          { key: 'all', label: 'All' },
          { key: 'new', label: `New (${newMatches.length})` },
          { key: 'active', label: `Active (${activeMatches.length})` },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.key
                ? 'bg-white dark:bg-dark-700 text-dark-900 dark:text-white shadow-sm'
                : 'text-dark-500 hover:text-dark-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Match List */}
      {filteredMatches.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-cupid-50 to-cupid-100 dark:from-cupid-900/20 dark:to-cupid-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-cupid-300" />
          </div>
          <h2 className="text-xl font-bold text-dark-700 dark:text-dark-300">
            {filter === 'all' ? 'No matches yet' : `No ${filter} matches`}
          </h2>
          <p className="text-dark-500 mt-2 max-w-sm mx-auto">
            Start discovering people nearby and swipe right!
          </p>
          <div className="max-w-sm mx-auto mt-6 mb-4">
            <InviteBanner variant="compact" />
          </div>
          <Link href="/discover" className="inline-block mt-6">
            <Button><Sparkles className="w-4 h-4 mr-2" /> Start Swiping</Button>
          </Link>
        </motion.div>
      ) : (
        <>
        <div className="grid gap-3">
          <AnimatePresence>
            {filteredMatches.map((match, i) => {
              const config = statusConfig[match.status] || statusConfig.pending_challenge;
              const StatusIcon = config.icon;
              const connectionLevel = match.relationship_scores?.[0]?.connection_level || 0;
              const overallScore = match.relationship_scores?.[0]?.overall_score || 0;

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        {match.has_unread && (
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-cupid-500 rounded-full border-2 border-white dark:border-dark-800 z-10" />
                        )}
                        <Avatar
                          src={match.other_user?.primary_photo_url}
                          alt={match.other_user?.display_name || '?'}
                          size="lg"
                        />
                        {match.status === 'unlocked' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-dark-800">
                            <MessageCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {match.status === 'pending_challenge' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cupid-500 rounded-full flex items-center justify-center border-2 border-white dark:border-dark-800">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-dark-900 dark:text-white truncate">
                            {match.other_user?.display_name || 'Someone'}
                          </h3>
                          <Badge variant={config.variant} className="text-xs flex items-center gap-1 flex-shrink-0">
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                        </div>

                        {match.other_user?.city && (
                          <p className="text-sm text-dark-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {match.other_user.city}
                          </p>
                        )}

                        {match.last_message && (
                          <p className="text-xs text-dark-400 mt-0.5 truncate max-w-[200px]">
                            {match.last_message}
                          </p>
                        )}

                        {connectionLevel > 0 && (
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-cupid-500" />
                              <span className="text-xs font-semibold text-dark-600 dark:text-dark-400">
                                Level {connectionLevel}
                              </span>
                            </div>
                            <div className="flex-1 max-w-24 h-1.5 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${overallScore}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                className="h-full bg-gradient-to-r from-cupid-400 to-cupid-500 rounded-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {match.status === 'unlocked' && (
                          <Link href={`/chat/${match.id}`}>
                            <Button variant="ghost" size="sm">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartDuel(match)}
                          loading={startingDuel === match.id}
                        >
                          <Swords className="w-4 h-4 mr-1" /> Duel
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
          <div className="mt-6">
            <InviteBanner variant="compact" />
          </div>
        </>
      )}
    </div>
  );
}
