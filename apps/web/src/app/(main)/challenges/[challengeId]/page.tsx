'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/components/ui/Toast';

export default function ChallengePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const router = useRouter();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [response, setResponse] = useState('');
  const [result, setResult] = useState<{ passed: boolean; score: number; feedback: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/challenges', token!);
        setChallenges(res.data || []);
      } catch { /* ignore */ }
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
        addToast('Challenge passed! Check your matches.', 'success');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
    setSubmitting(false);
  }

  if (!challenge) {
    return <div className="text-center py-20 text-dark-400">Loading challenge...</div>;
  }

  const template = challenge.challenge_templates;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-cupid-500" />
        <h1 className="text-2xl font-bold text-dark-900">Challenge</h1>
      </div>

      <Card>
        <div className="mb-6">
          <span className="text-xs font-medium text-cupid-500 uppercase tracking-wider">
            {template?.category || 'Challenge'}
          </span>
          <h2 className="text-lg font-bold text-dark-900 mt-2">
            {template?.question_text}
          </h2>
        </div>

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            {result.passed ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-600">Challenge Passed!</h3>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-500">Not quite...</h3>
              </>
            )}
            <p className="text-dark-500 mt-2">{result.feedback}</p>
            <p className="text-sm text-dark-400 mt-1">Score: {Math.round(result.score * 100)}%</p>
            <Button className="mt-6" onClick={() => router.push('/matches')}>
              Back to Matches
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your thoughtful response here..."
              className="w-full h-40 rounded-xl border border-dark-200 p-4 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-200 focus:outline-none resize-none"
              maxLength={2000}
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              {response.trim().split(/\s+/).filter(Boolean).length} words
            </p>
            <Button type="submit" className="w-full mt-4" loading={submitting}>
              Submit Response
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
