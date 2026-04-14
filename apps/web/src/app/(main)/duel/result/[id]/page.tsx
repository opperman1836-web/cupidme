'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, Heart, Star, Zap, MapPin, Coffee,
  Utensils, ArrowRight, Crown, Sparkles, Share2, RotateCcw,
  MessageCircle, ChevronRight, Gift,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';
import { ShareCard } from '@/components/duel/ShareCard';
import { Confetti } from '@/components/duel/Confetti';

function AnimatedScore({ target, delay = 0 }: { target: number; delay?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1500;
      const steps = 40;
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);

  return <span ref={ref}>{count}</span>;
}

export default function DuelResultPage() {
  const { id: duelId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const addToast = useToastStore((s) => s.addToast);

  const [duel, setDuel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInsight, setShowInsight] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>(`/api/duels/${duelId}`, token!);
        setDuel(res.data);

        // Staggered reveal animation
        setTimeout(() => setRevealPhase(1), 500);  // Show scores
        setTimeout(() => setRevealPhase(2), 1500); // Show compatibility
        setTimeout(() => setRevealPhase(3), 2500); // Show insight
        setTimeout(() => setShowInsight(true), 3000);
      } catch (err: any) {
        addToast(err.message || 'Failed to load results', 'error');
      } finally {
        setLoading(false);
      }
    }
    if (token && duelId) load();
  }, [token, duelId, addToast]);

  if (loading || !duel) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Trophy className="w-16 h-16 text-amber-400" />
        </motion.div>
      </div>
    );
  }

  const isUser1 = duel.user1_id === userId;
  const myScore = isUser1 ? duel.user1_score : duel.user2_score;
  const theirScore = isUser1 ? duel.user2_score : duel.user1_score;
  const isWinner = myScore > theirScore;
  const isTie = myScore === theirScore;
  const compatibility = Math.round(duel.compatibility_score || 0);

  const myProfile = duel.profiles?.find((p: any) => p.user_id === userId);
  const opponentProfile = duel.profiles?.find((p: any) => p.user_id !== userId);

  const myAnswers = duel.my_answers || [];
  const opponentAnswers = duel.opponent_answers || [];
  const venues = duel.suggested_venues || [];
  const questions = duel.duel_questions || [];

  return (
    <div className="max-w-lg mx-auto">
      {/* Trophy Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
          className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow ${
            isWinner
              ? 'bg-gradient-to-br from-amber-400 to-amber-600'
              : isTie
                ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                : 'bg-gradient-to-br from-dark-400 to-dark-600'
          }`}
        >
          {isWinner ? (
            <Crown className="w-12 h-12 text-white" />
          ) : isTie ? (
            <Swords className="w-12 h-12 text-white" />
          ) : (
            <Star className="w-12 h-12 text-white" />
          )}
        </motion.div>

        <AnimatePresence>
          {revealPhase >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-black text-dark-900">
                {isWinner ? 'Victory!' : isTie ? "It's a Tie!" : 'Great Game!'}
              </h1>
              <p className="text-dark-500 mt-1 capitalize">{duel.type} Duel Complete</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Score Cards */}
      <AnimatePresence>
        {revealPhase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="overflow-hidden p-0">
              <div className="grid grid-cols-3">
                {/* My score */}
                <div className={`p-6 text-center ${isWinner ? 'bg-amber-50' : 'bg-white'}`}>
                  <Avatar
                    alt={myProfile?.display_name || 'You'}
                    size="md"
                  />
                  <p className="font-bold text-dark-900 mt-2 text-sm truncate">
                    {myProfile?.display_name || 'You'}
                  </p>
                  <p className="text-3xl font-black text-cupid-500 mt-1">
                    <AnimatedScore target={myScore} delay={500} />
                  </p>
                  {isWinner && (
                    <Badge variant="success" className="mt-2">Winner</Badge>
                  )}
                </div>

                {/* VS */}
                <div className="flex items-center justify-center bg-dark-50">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-1"
                    >
                      <Swords className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className="text-xs font-bold text-dark-500">VS</span>
                  </div>
                </div>

                {/* Their score */}
                <div className={`p-6 text-center ${!isWinner && !isTie ? 'bg-amber-50' : 'bg-white'}`}>
                  <Avatar
                    alt={opponentProfile?.display_name || 'Opponent'}
                    size="md"
                  />
                  <p className="font-bold text-dark-900 mt-2 text-sm truncate">
                    {opponentProfile?.display_name || 'Opponent'}
                  </p>
                  <p className="text-3xl font-black text-blue-500 mt-1">
                    <AnimatedScore target={theirScore} delay={800} />
                  </p>
                  {!isWinner && !isTie && (
                    <Badge variant="success" className="mt-2">Winner</Badge>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compatibility Score */}
      <AnimatePresence>
        {revealPhase >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="text-center glass-cupid">
              <Heart className="w-8 h-8 text-cupid-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-cupid-700 mb-1">Compatibility</p>
              <div className="relative w-32 h-32 mx-auto my-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none" stroke="#FFE4E6" strokeWidth="8"
                  />
                  <motion.circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - compatibility / 100) }}
                    transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-black text-cupid-600">
                    <AnimatedScore target={compatibility} delay={300} />
                    <span className="text-lg">%</span>
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Insight */}
      <AnimatePresence>
        {revealPhase >= 3 && duel.ai_insight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-violet-50 to-cupid-50 border-violet-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-violet-700 mb-1">AI Compatibility Insight</p>
                  <p className="text-sm text-dark-700 leading-relaxed">{duel.ai_insight}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer Comparison */}
      {showInsight && questions.length > 0 && opponentAnswers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-dark-900 mb-3">Answer Comparison</h2>
          <div className="space-y-2">
            {questions.map((q: any, i: number) => {
              const myA = myAnswers.find((a: any) => a.question_id === q.id);
              const theirA = opponentAnswers.find((a: any) => a.question_id === q.id);
              const matched = myA?.answer === theirA?.answer;

              return (
                <Card key={q.id} className={`!p-4 ${matched ? 'border-emerald-200 bg-emerald-50/50' : ''}`}>
                  <p className="text-sm font-semibold text-dark-700 mb-2">
                    {i + 1}. {q.question_text}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`px-3 py-1.5 rounded-lg ${matched ? 'bg-emerald-100 text-emerald-700' : 'bg-cupid-50 text-cupid-700'}`}>
                      You: {myA?.answer || '—'}
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg ${matched ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                      Them: {theirA?.answer || '—'}
                    </div>
                  </div>
                  {matched && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
                      <Heart className="w-3 h-3 fill-emerald-500" /> You both agree!
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Suggested Venues */}
      {showInsight && venues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-dark-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cupid-500" /> Suggested Date Venues
          </h2>
          <div className="space-y-2">
            {venues.map((venue: any) => (
              <Link key={venue.id} href={`/venues/${venue.id}`}>
                <Card hover className="flex items-center gap-4 !py-3">
                  <div className="w-12 h-12 bg-cupid-50 rounded-xl flex items-center justify-center">
                    {venue.category === 'coffee_shop' ? (
                      <Coffee className="w-6 h-6 text-cupid-500" />
                    ) : (
                      <Utensils className="w-6 h-6 text-cupid-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-dark-900 text-sm">{venue.name}</p>
                    <p className="text-xs text-dark-500">{venue.city}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-dark-300" />
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Share Card — VIRAL LOOP */}
      {showInsight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <ShareCard
            duelId={duelId}
            inviterName={myProfile?.display_name || 'You'}
            opponentName={opponentProfile?.display_name || 'Opponent'}
            compatibility={compatibility}
          />
        </motion.div>
      )}

      {/* Actions */}
      {showInsight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 mb-8"
        >
          {duel.match_id && (
            <Link href={`/chat/${duel.match_id}`} className="block">
              <Button className="w-full" variant="primary">
                <MessageCircle className="w-4 h-4 mr-2" /> Chat with Match
              </Button>
            </Link>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => router.push('/duel/invite')}>
              <RotateCcw className="w-4 h-4 mr-2" /> Play Again
            </Button>
            <Link href="/venues" className="block">
              <Button variant="outline" className="w-full">
                <Gift className="w-4 h-4 mr-2" /> Browse Venues
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Confetti on result reveal */}
      <Confetti trigger={revealPhase >= 2 && isWinner} />
    </div>
  );
}
