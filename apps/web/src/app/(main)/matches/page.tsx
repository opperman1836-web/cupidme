'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatTimeLeft } from '@/lib/utils';

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/matches', token!);
        setMatches(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  if (loading) return <div className="text-dark-400 text-center py-20">Loading matches...</div>;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending_challenge': return <Badge variant="warning">Challenge Pending</Badge>;
      case 'challenge_active': return <Badge variant="info">Challenge Active</Badge>;
      case 'unlocked': return <Badge variant="success">Unlocked</Badge>;
      case 'expired': return <Badge variant="danger">Expired</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Your Matches</h1>
      {matches.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <p className="text-dark-500">No matches yet. Start discovering!</p>
          <Link href="/discover" className="text-cupid-500 font-medium mt-2 inline-block hover:underline">
            Go to Discover
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <Link key={match.id} href={match.status === 'unlocked' ? `/chat/${match.id}` : `/challenges/${match.id}`}>
              <Card hover className="flex items-center gap-4">
                <Avatar
                  src={match.other_user?.primary_photo_url}
                  alt={match.other_user?.display_name || '?'}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-dark-900 truncate">
                      {match.other_user?.display_name}
                    </h3>
                    {statusBadge(match.status)}
                  </div>
                  <p className="text-sm text-dark-500 mt-1">{match.other_user?.city}</p>
                  {match.relationship_scores?.[0] && (
                    <div className="flex items-center gap-2 mt-2">
                      <Zap className="w-3.5 h-3.5 text-cupid-500" />
                      <span className="text-xs text-dark-500">
                        Level {match.relationship_scores[0].connection_level} &middot; Score {match.relationship_scores[0].overall_score}
                      </span>
                    </div>
                  )}
                  {match.chat_expires_at && match.status === 'unlocked' && (
                    <p className="text-xs text-dark-400 mt-1">
                      Chat: {formatTimeLeft(match.chat_expires_at)}
                    </p>
                  )}
                </div>
                <MessageCircle className="w-5 h-5 text-dark-300 flex-shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
