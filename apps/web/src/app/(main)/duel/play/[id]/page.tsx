'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Clock, Zap, CheckCircle2, Trophy, Heart,
  ArrowRight, Star, Sparkles, Shield,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useDuelStore } from '@/stores/duelStore';
import { useDuelRealtime } from '@/hooks/useDuelRealtime';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/components/ui/Toast';

type Phase = 'loading' | 'countdown' | 'question' | 'answered' | 'completing' | 'done';

export default function DuelPlayPage() {
  const { id: duelId } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const addToast = useToastStore((s) => s.addToast);

  const {
    questions, setQuestions, currentQuestionIndex, nextQuestion,
    myScore, addScore, addAnswer, setDuel, reset,
  } = useDuelStore();

  useDuelRealtime(duelId);

  const [phase, setPhase] = useState<Phase>('loading');
  const [duel, setDuelLocal] = useState<any>(null);
  const [timer, setTimer] = useState(15);
  const [countdownNum, setCountdownNum] = useState(3);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize duel
  useEffect(() => {
    async function init() {
      try {
        const res = await api.post<any>(`/api/duels/${duelId}/start`, {}, token!);
        const { duel: d, questions: q } = res.data;
        setDuelLocal(d);
        setDuel(d);
        setQuestions(q);

        // Start countdown
        setPhase('countdown');
        setCountdownNum(3);
      } catch (err: any) {
        addToast(err.message || 'Failed to start duel', 'error');
        router.push('/duel/invite');
      }
    }
    if (token && duelId) {
      reset();
      init();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [token, duelId]);

  // Countdown effect
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdownNum <= 0) {
      setPhase('question');
      startTimer();
      return;
    }

    const t = setTimeout(() => setCountdownNum((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownNum]);

  function startTimer() {
    const q = questions[currentQuestionIndex];
    if (!q) return;

    setTimer(q.time_limit_seconds);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, q.time_limit_seconds - elapsed);
      setTimer(Math.ceil(remaining));

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleAutoSubmit();
      }
    }, 100);
  }

  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return; // Already submitting
    if (selectedOption) return;
    // Auto-submit with first option if time runs out
    const q = questions[currentQuestionIndex];
    if (q) {
      await submitAnswer(q.option_a);
    }
  }, [currentQuestionIndex, questions, selectedOption, submitting]);

  async function submitAnswer(answer: string) {
    const q = questions[currentQuestionIndex];
    if (!q || submitting) return;

    setSubmitting(true);
    setSelectedOption(answer);

    if (timerRef.current) clearInterval(timerRef.current);

    const answeredIn = (Date.now() - startTimeRef.current) / 1000;

    try {
      const res = await api.post<any>(`/api/duels/${duelId}/answer`, {
        question_id: q.id,
        answer,
        answered_in_seconds: Math.round(answeredIn * 100) / 100,
      }, token!);

      const pts = res.data.points_earned;
      addScore(pts);
      setPointsEarned(pts);
      addAnswer(res.data.answer);

      setPhase('answered');

      // Move to next question after delay
      setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
          nextQuestion();
          setSelectedOption(null);
          setPointsEarned(0);
          setSubmitting(false);
          setPhase('countdown');
          setCountdownNum(1); // Short countdown between questions
        } else {
          handleComplete();
        }
      }, 1500);
    } catch (err: any) {
      addToast(err.message || 'Failed to submit answer', 'error');
      setSubmitting(false);
    }
  }

  async function handleComplete() {
    setPhase('completing');
    try {
      const res = await api.post<any>(`/api/duels/${duelId}/complete`, {}, token!);
      if (res.data.status === 'completed') {
        router.push(`/duel/result/${duelId}`);
      } else {
        setPhase('done');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
      router.push(`/duel/result/${duelId}`);
    }
  }

  const currentQ = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;
  const options = currentQ ? [
    currentQ.option_a,
    currentQ.option_b,
    ...(currentQ.option_c ? [currentQ.option_c] : []),
    ...(currentQ.option_d ? [currentQ.option_d] : []),
  ] : [];

  const optionColors = [
    'from-cupid-500 to-cupid-600',
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
  ];

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Swords className="w-16 h-16 text-cupid-500" />
        </motion.div>
      </div>
    );
  }

  // ── COUNTDOWN ──
  if (phase === 'countdown') {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={countdownNum}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {countdownNum > 0 ? (
              <span className="text-8xl font-black text-gradient">{countdownNum}</span>
            ) : (
              <div>
                <Swords className="w-20 h-20 text-cupid-500 mx-auto mb-4" />
                <span className="text-4xl font-black text-dark-900">GO!</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── COMPLETING (waiting for opponent) ──
  if (phase === 'completing' || phase === 'done') {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-black text-dark-900 mb-2">
            {phase === 'completing' ? 'Finishing up...' : 'Waiting for opponent'}
          </h2>
          <p className="text-dark-500 mb-2">Your score: <span className="font-bold text-cupid-500">{myScore}</span></p>
          {phase === 'done' && (
            <p className="text-sm text-dark-400 mb-6">
              Your opponent is still playing. Check back soon!
            </p>
          )}
          {phase === 'done' && (
            <Button onClick={() => router.push(`/duel/result/${duelId}`)}>
              View Results <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── QUESTION / ANSWERED PHASES ──
  return (
    <div className="max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-cupid-500" />
          <span className="text-sm font-bold text-dark-700">
            Question {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-dark-700">{myScore} pts</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-dark-100 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-gradient-to-r from-cupid-400 to-cupid-600 rounded-full"
          initial={{ width: `${progress}%` }}
          animate={{ width: `${((currentQuestionIndex + (phase === 'answered' ? 1 : 0)) / questions.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-6">
        <motion.div
          className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
            timer <= 5 ? 'border-red-400 text-red-500' : 'border-cupid-300 text-cupid-600'
          }`}
          animate={timer <= 5 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timer <= 5 ? Infinity : 0 }}
        >
          <div className="text-center">
            <Clock className="w-4 h-4 mx-auto mb-0.5" />
            <span className="text-2xl font-black">{timer}</span>
          </div>
        </motion.div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ?.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass mb-6 text-center">
            <p className="text-xl font-bold text-dark-900 leading-relaxed">
              {currentQ?.question_text}
            </p>
          </Card>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {options.map((option, i) => {
              const isSelected = selectedOption === option;
              return (
                <motion.button
                  key={`${currentQ?.id}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={phase !== 'answered' ? { scale: 0.95 } : {}}
                  disabled={phase === 'answered' || submitting}
                  onClick={() => submitAnswer(option)}
                  className={`relative p-5 rounded-2xl text-left transition-all ${
                    isSelected
                      ? `bg-gradient-to-br ${optionColors[i]} text-white shadow-xl`
                      : phase === 'answered'
                        ? 'bg-dark-100 text-dark-400'
                        : 'bg-white border-2 border-dark-100 text-dark-700 hover:border-cupid-300 hover:shadow-md'
                  }`}
                >
                  <span className={`absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSelected ? 'bg-white/20' : 'bg-dark-100'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <p className="text-sm font-semibold mt-5">{option}</p>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Points earned toast */}
      <AnimatePresence>
        {phase === 'answered' && pointsEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-dark-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="font-bold">+{pointsEarned} points!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
