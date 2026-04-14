'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Zap, Users, Share2, Flame, Crown, Star,
  TrendingUp, Gift, ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function DuelStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/invites/stats', token!);
        setStats(res.data);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  if (loading || !stats) return null;

  const { metrics, duel_stats, recent_invites } = stats;
  const conversionRate = metrics.invites_sent > 0
    ? Math.round((metrics.invites_accepted / metrics.invites_sent) * 100)
    : 0;

  // Determine badge
  const totalPlayed = duel_stats.total_duels_played || 0;
  const badge = totalPlayed >= 50 ? { label: 'Duel Legend', color: 'from-amber-400 to-amber-600', icon: Crown }
    : totalPlayed >= 20 ? { label: 'Top Dueler', color: 'from-violet-400 to-violet-600', icon: Star }
    : totalPlayed >= 5 ? { label: 'Rising Star', color: 'from-blue-400 to-blue-600', icon: TrendingUp }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Badge */}
      {badge && (
        <div className="flex items-center justify-center">
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${badge.color} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}>
            <badge.icon className="w-4 h-4" />
            {badge.label}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center !p-4">
          <Share2 className="w-5 h-5 text-cupid-500 mx-auto mb-1" />
          <p className="text-xl font-black text-dark-900">{metrics.shares_count}</p>
          <p className="text-xs text-dark-500">Shares</p>
        </Card>
        <Card className="text-center !p-4">
          <Users className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-black text-dark-900">{metrics.invites_accepted}</p>
          <p className="text-xs text-dark-500">Joined</p>
        </Card>
        <Card className="text-center !p-4">
          <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-black text-dark-900">{metrics.best_streak}</p>
          <p className="text-xs text-dark-500">Best Streak</p>
        </Card>
      </div>

      {/* Conversion rate */}
      {metrics.invites_sent > 0 && (
        <Card className="flex items-center gap-4 !py-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-dark-900">Invite Conversion</p>
            <p className="text-xs text-dark-500">{metrics.invites_accepted} of {metrics.invites_sent} invites accepted</p>
          </div>
          <span className="text-lg font-black text-emerald-500">{conversionRate}%</span>
        </Card>
      )}

      {/* Chain depth */}
      {metrics.chain_depth > 0 && (
        <Card className="flex items-center gap-4 !py-3 bg-cupid-50 border-cupid-200">
          <div className="w-10 h-10 bg-cupid-100 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-cupid-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-cupid-800">Viral Chain</p>
            <p className="text-xs text-cupid-600">You&apos;re {metrics.chain_depth} levels deep in the invite chain!</p>
          </div>
        </Card>
      )}

      {/* Recent invites */}
      {recent_invites.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-dark-700 mb-2">Recent Invites</h3>
          <div className="space-y-1">
            {recent_invites.slice(0, 3).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between py-2 px-3 bg-dark-50 rounded-xl text-sm">
                <span className="text-dark-600 truncate flex-1">{inv.invitee_email || inv.invite_code}</span>
                <Badge variant={inv.status === 'accepted' ? 'success' : 'warning'} className="text-xs ml-2">
                  {inv.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
