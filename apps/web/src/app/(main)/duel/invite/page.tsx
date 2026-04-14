'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Swords, Zap, Crown, Gift, ArrowRight, Users,
  Sparkles, Clock, CreditCard, Star, Heart,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';

const duelTypes = [
  { value: 'compatibility', label: 'Compatibility', icon: Heart, description: 'Shared values & goals', color: 'from-cupid-400 to-cupid-600' },
  { value: 'icebreaker', label: 'Icebreaker', icon: Sparkles, description: 'Fun getting-to-know-you', color: 'from-blue-400 to-blue-600' },
  { value: 'deep_connection', label: 'Deep Connection', icon: Star, description: 'Life philosophy & emotions', color: 'from-violet-400 to-violet-600' },
  { value: 'fun', label: 'Fun & Playful', icon: Zap, description: 'Light-hearted scenarios', color: 'from-amber-400 to-amber-600' },
  { value: 'rapid_fire', label: 'Rapid Fire', icon: Clock, description: 'Quick this-or-that picks', color: 'from-emerald-400 to-emerald-600' },
];

function DuelInviteContent() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  const [matches, setMatches] = useState<any[]>([]);
  const [credits, setCredits] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('compatibility');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [myDuels, setMyDuels] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [matchRes, creditRes, duelRes] = await Promise.all([
          api.get<any>('/api/matches', token!),
          api.get<any>('/api/duels/credits/balance', token!),
          api.get<any>('/api/duels/my', token!),
        ]);
        setMatches((matchRes.data || []).filter((m: any) => m.status === 'unlocked'));
        setCredits(creditRes.data);
        setMyDuels(duelRes.data || []);
      } catch { /* ignore — user may have no matches yet */ }
      setLoading(false);
    }

    if (token) {
      load();
    } else {
      // No token yet — stop loading spinner (user just registered, store hydrating)
      setLoading(false);
    }
  }, [token]);

  async function handleCreateDuel() {
    if (!selectedMatch) {
      addToast('Select a match to duel', 'error');
      return;
    }

    const match = matches.find((m) => m.id === selectedMatch);
    if (!match) return;

    setCreating(true);
    try {
      const res = await api.post<any>('/api/duels/create', {
        opponent_id: match.other_user?.id || match.user2_id,
        match_id: match.id,
        type: selectedType,
      }, token!);

      addToast('Duel created! Starting...', 'success');
      router.push(`/duel/play/${res.data.id}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to create duel', 'error');
    }
    setCreating(false);
  }

  async function handlePracticeDuel() {
    setCreating(true);
    try {
      const res = await api.post<any>('/api/duels/create', {
        type: selectedType,
      }, token!);

      addToast('Practice duel starting!', 'success');
      router.push(`/duel/play/${res.data.id}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to create practice duel', 'error');
    }
    setCreating(false);
  }

  async function handleClaimFree() {
    try {
      const res = await api.post<any>('/api/duels/credits/claim', {}, token!);
      setCredits(res.data);
      addToast('Free credit claimed!', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  }

  async function handlePurchase(pkg: string) {
    try {
      const res = await api.post<any>('/api/duels/credits/purchase', { package: pkg }, token!);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      addToast(err.message || 'Purchase failed', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Swords className="w-12 h-12 text-cupid-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow">
          <Swords className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-dark-900">Cupid Duel</h1>
        <p className="text-dark-500 mt-2">
          Challenge your match to a quiz duel. Answer questions, earn points, discover compatibility!
        </p>
      </motion.div>

      {/* Credits Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6 bg-gradient-to-r from-dark-900 to-dark-800 text-white border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-dark-400">Duel Credits</p>
                <p className="text-3xl font-black">{credits?.credits ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-dark-400">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{credits?.total_duels_played ?? 0}</p>
                <p>Played</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{credits?.total_wins ?? 0}</p>
                <p>Wins</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              className="!text-white hover:!bg-white/10"
              onClick={handleClaimFree}
            >
              <Gift className="w-4 h-4 mr-1" /> Monthly Free
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="!text-white hover:!bg-white/10"
              onClick={() => handlePurchase('5_credits')}
            >
              <CreditCard className="w-4 h-4 mr-1" /> 5 for R49
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="!text-white hover:!bg-white/10"
              onClick={() => handlePurchase('20_credits')}
            >
              <Crown className="w-4 h-4 mr-1" /> 20 for R149
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Duel Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-lg font-bold text-dark-900 mb-3">Choose Duel Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {duelTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                selectedType === type.value
                  ? 'border-cupid-500 bg-cupid-50 shadow-md'
                  : 'border-dark-100 hover:border-dark-200'
              }`}
            >
              <div className={`w-8 h-8 bg-gradient-to-br ${type.color} rounded-lg flex items-center justify-center mb-2`}>
                <type.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-bold text-dark-900">{type.label}</p>
              <p className="text-xs text-dark-500 mt-0.5">{type.description}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Select Opponent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-lg font-bold text-dark-900 mb-3">Challenge a Match</h2>
        {matches.length === 0 ? (
          <Card className="text-center py-8">
            <Users className="w-10 h-10 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-500 text-sm mb-4">No unlocked matches yet. Try a practice duel!</p>
            <Button onClick={handlePracticeDuel} loading={creating}>
              <Swords className="w-4 h-4 mr-2" />
              Practice Duel
            </Button>
          </Card>
        ) : (
          <div className="grid gap-2">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedMatch === match.id
                    ? 'border-cupid-500 bg-cupid-50 shadow-md'
                    : 'border-dark-100 bg-white hover:border-dark-200'
                }`}
              >
                <Avatar
                  src={match.other_user?.primary_photo_url}
                  alt={match.other_user?.display_name || '?'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-dark-900 truncate">
                    {match.other_user?.display_name || 'Your Match'}
                  </p>
                  <p className="text-sm text-dark-500">{match.other_user?.city}</p>
                </div>
                {selectedMatch === match.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 bg-cupid-500 rounded-full flex items-center justify-center"
                  >
                    <Swords className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          className="w-full !py-4 !text-lg !rounded-2xl"
          onClick={handleCreateDuel}
          loading={creating}
          disabled={!selectedMatch}
        >
          <Swords className="w-5 h-5 mr-2" />
          Start Duel
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Recent Duels */}
      {myDuels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h2 className="text-lg font-bold text-dark-900 mb-3">Recent Duels</h2>
          <div className="space-y-2">
            {myDuels.slice(0, 5).map((duel) => (
              <button
                key={duel.id}
                onClick={() => router.push(
                  duel.status === 'completed' ? `/duel/result/${duel.id}` :
                  duel.status === 'active' ? `/duel/play/${duel.id}` :
                  `/duel/play/${duel.id}`
                )}
                className="w-full"
              >
                <Card hover className="flex items-center gap-4 !py-3">
                  <div className="w-10 h-10 bg-dark-100 rounded-xl flex items-center justify-center">
                    <Swords className="w-5 h-5 text-dark-500" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-dark-900 text-sm capitalize">{duel.type} Duel</p>
                    <p className="text-xs text-dark-400">
                      Score: {duel.user1_score} vs {duel.user2_score}
                    </p>
                  </div>
                  <Badge variant={
                    duel.status === 'completed' ? 'success' :
                    duel.status === 'active' ? 'info' :
                    duel.status === 'pending' ? 'warning' : 'danger'
                  }>
                    {duel.status}
                  </Badge>
                </Card>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Wrap in Suspense because this page previously used useSearchParams
// which requires Suspense in Next.js 14 App Router
export default function DuelInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <Swords className="w-12 h-12 text-cupid-500 animate-spin" />
      </div>
    }>
      <DuelInviteContent />
    </Suspense>
  );
}
