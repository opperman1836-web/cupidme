'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, XCircle, Trophy, Clock, Heart,
  ArrowLeft, Zap, Star, Brain, Lightbulb, MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';
import { formatTimeLeft } from '@/lib/utils';

const categoryConfig: Record<string, { icon: any; color: string; bg: string }> = {
  icebreaker: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  values: { icon: Heart, color: 'text-cupid-500', bg: 'bg-cupid-50' },
  compatibility: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  fun: { icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  deep: { icon: Brain, color: 'text-violet-500', bg: 'bg-violet-50' },
};

export default function ChallengePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const router = useRouter();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [response, setResponse] = useState('');
  const [result, setResult] = useState<{ passed: boolean; score: number; feedback: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/challenges', token!);
        setChallenges(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  const challenge = challenges.find((c) => c.match_id === challengeId || c.id === challengeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setSubmitting(true);
    try {
      const res = await api.post<any>(`/api/challenges/${challenge.id}/submit`, {
        response_text: response,
      }, token!);
      setResult(res.data);
      if (res.data.passed) {
        addToast('Challenge passed! Your match is unlocking...', 'success');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-10 h-10 text-cupid-500" />
        </motion.div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Sparkles className="w-16 h-16 text-dark-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-dark-700">No active challenge</h2>
        <p className="text-dark-500 mt-2">This challenge may have expired or been completed.</p>
        <Link href="/matches" className="inline-block mt-4">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Matches
          </Button>
        </Link>
      </div>
    );
  }

  const template = challenge.challenge_templates;
  const category = template?.category || 'icebreaker';
  const config = categoryConfig[category] || categoryConfig.icebreaker;
  const CategoryIcon = config.icon;
  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;
  const minWords = template?.evaluation_criteria?.min_word_count || 20;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <Link href="/matches" className="inline-flex items-center gap-1 text-dark-500 hover:text-cupid-500 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Matches
      </Link>

      {/* Challenge Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          {/* Category header */}
          <div className={`${config.bg} px-6 py-4 -m-6 mb-6 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                <CategoryIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <span className={`text-xs font-bold ${config.color} uppercase tracking-wider`}>
                  {category} Challenge
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="info">{template?.difficulty || 'medium'}</Badge>
                  {challenge.expires_at && (
                    <span className="text-xs text-dark-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTimeLeft(challenge.expires_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-dark-900 leading-relaxed">
              {template?.question_text}
            </h2>
            <p className="text-sm text-dark-400 mt-2">
              <Lightbulb className="w-3.5 h-3.5 inline mr-1" />
              Be thoughtful and genuine. AI will evaluate your response for depth and authenticity.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                {result.passed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-600">Challenge Passed!</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span className="text-lg font-bold text-amber-600">{Math.round(result.score * 100)}% Compatibility</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    <div className="w-24 h-24 bg-dark-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <XCircle className="w-14 h-14 text-dark-400" />
                    </div>
                    <h3 className="text-2xl font-black text-dark-600">Not quite there</h3>
                    <p className="text-sm text-dark-400 mt-1">Score: {Math.round(result.score * 100)}%</p>
                  </motion.div>
                )}
                <div className="bg-dark-50 rounded-2xl p-5 mt-6 text-left">
                  <p className="text-sm font-semibold text-dark-500 mb-2">AI Feedback:</p>
                  <p className="text-dark-700 leading-relaxed">{result.feedback}</p>
                </div>
                <Button className="mt-6" onClick={() => router.push('/matches')}>
                  <Heart className="w-4 h-4 mr-2" /> View Matches
                </Button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Write your thoughtful response here... Be genuine and specific."
                    className="w-full h-48 rounded-2xl border-2 border-dark-100 p-5 focus:border-cupid-500 focus:ring-0 focus:outline-none resize-none text-dark-700 leading-relaxed transition-colors"
                    maxLength={2000}
                    required
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className={`text-xs font-medium ${wordCount >= minWords ? 'text-emerald-500' : 'text-dark-400'}`}>
                      {wordCount}/{minWords} words min
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-dark-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${wordCount >= minWords ? 'bg-emerald-500' : 'bg-cupid-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (wordCount / minWords) * 100)}%` }}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  loading={submitting}
                  disabled={wordCount < minWords}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Response
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
