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

// Haptic feedback — fails silently on desktop
function haptic(pattern: number | number[]) {
  try { navigator?.vibrate?.(pattern); } catch {}
}

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
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
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

  // Countdown effect — with haptic ticks
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdownNum <= 0) {
      haptic([50, 50, 100]); // GO! burst
      setPhase('question');
      startTimer();
      return;
    }

    haptic(20); // tick on each count
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

    // Instant tactile feedback on tap
    haptic(10);

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
      const correct = pts > 0;

      addScore(pts);
      setPointsEarned(pts);
      setWasCorrect(correct);
      addAnswer(res.data.answer);

      // Celebrate / commiserate
      if (correct) {
        haptic([40, 30, 40]); // Success pulse
      } else {
        haptic(120); // Long buzz for wrong
      }

      setPhase('answered');

      // Move to next question after delay
      setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
          nextQuestion();
          setSelectedOption(null);
          setPointsEarned(0);
          setWasCorrect(null);
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
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Swords className="w-16 h-16 text-cupid-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
        </motion.div>
      </div>
    );
  }

  // ── COUNTDOWN ──
  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center">
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
              <span className="text-[12rem] font-black bg-gradient-to-br from-cupid-400 via-cupid-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(244,63,94,0.6)]">
                {countdownNum}
              </span>
            ) : (
              <div>
                <Swords className="w-24 h-24 text-cupid-400 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]" />
                <span className="text-6xl font-black text-white tracking-tight">GO!</span>
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
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-28 h-28 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(244,63,94,0.4)]"
          >
            <Trophy className="w-14 h-14 text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-3">
            {phase === 'completing' ? 'Finishing up...' : 'Waiting for opponent'}
          </h2>
          <p className="text-dark-300 text-lg mb-2">
            Your score:{' '}
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cupid-400 to-purple-400">
              {myScore}
            </span>
          </p>
          {phase === 'done' && (
            <p className="text-sm text-dark-400 mb-6 max-w-xs mx-auto">
              Your opponent is still playing. Check back soon!
            </p>
          )}
          {phase === 'done' && (
            <Button
              onClick={() => router.push(`/duel/result/${duelId}`)}
              className="bg-gradient-to-r from-cupid-500 to-cupid-600 hover:from-cupid-600 hover:to-cupid-700 text-white shadow-xl shadow-cupid-500/30"
            >
              View Results <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── QUESTION / ANSWERED PHASES ──
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 overflow-y-auto">
      {/* Ambient glow accents */}
      <div className="absolute top-0 -right-20 w-80 h-80 bg-cupid-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-5 pt-6 pb-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
            <Swords className="w-4 h-4 text-cupid-400" />
            <span className="text-sm font-bold text-white">
              {currentQuestionIndex + 1}<span className="text-white/50">/{questions.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-md rounded-full border border-amber-400/30">
            <Zap className="w-4 h-4 text-amber-400" fill="currentColor" />
            <span className="text-sm font-bold text-amber-200">{myScore} pts</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-8 border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-cupid-400 via-cupid-500 to-purple-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]"
            initial={{ width: `${progress}%` }}
            animate={{ width: `${((currentQuestionIndex + (phase === 'answered' ? 1 : 0)) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-8">
          <motion.div
            className={`w-24 h-24 rounded-full flex items-center justify-center border-[3px] backdrop-blur-md shadow-xl ${
              timer <= 5
                ? 'border-red-400 bg-red-500/10 shadow-red-500/30'
                : 'border-cupid-400 bg-cupid-500/10 shadow-cupid-500/30'
            }`}
            animate={timer <= 5 ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.5, repeat: timer <= 5 ? Infinity : 0 }}
          >
            <div className="text-center">
              <Clock className={`w-4 h-4 mx-auto mb-0.5 ${timer <= 5 ? 'text-red-400' : 'text-cupid-400'}`} />
              <span className={`text-3xl font-black tracking-tight ${timer <= 5 ? 'text-red-400' : 'text-white'}`}>
                {timer}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Question Card + Options — with directional slide transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ?.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Question Card — elevated, readable, fade+scale in */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mb-8 p-6 sm:p-8 rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-2xl text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-cupid-400 font-black mb-3">
                Question {currentQuestionIndex + 1}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                {currentQ?.question_text}
              </p>
            </motion.div>

            {/* Options — game-feel feedback */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((option, i) => {
                const isSelected = selectedOption === option;
                const isAnswered = phase === 'answered';
                const isDisabled = isAnswered || submitting;

                // Derive visual state
                let visualState: 'idle' | 'selected-correct' | 'selected-wrong' | 'faded' = 'idle';
                if (isAnswered) {
                  if (isSelected) {
                    visualState = wasCorrect ? 'selected-correct' : 'selected-wrong';
                  } else {
                    visualState = 'faded';
                  }
                }

                const stateClasses = {
                  'idle': 'bg-white text-dark-900 shadow-lg hover:shadow-2xl hover:shadow-cupid-500/30',
                  'selected-correct': 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-500/50 ring-4 ring-emerald-300/50',
                  'selected-wrong': 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-2xl shadow-red-500/50 ring-4 ring-red-300/50',
                  'faded': 'bg-white/10 text-white/40 backdrop-blur-sm',
                }[visualState];

                const pillClasses = {
                  'idle': 'bg-gradient-to-br from-cupid-500 to-cupid-600 text-white',
                  'selected-correct': 'bg-white/25 text-white',
                  'selected-wrong': 'bg-white/25 text-white',
                  'faded': 'bg-white/10 text-white/40',
                }[visualState];

                return (
                  <motion.button
                    key={`${currentQ?.id}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={
                      visualState === 'selected-correct' || visualState === 'selected-wrong'
                        ? { opacity: 1, y: 0, scale: [1, 1.08, 1] }
                        : { opacity: 1, y: 0 }
                    }
                    transition={
                      visualState === 'selected-correct' || visualState === 'selected-wrong'
                        ? { delay: 0, duration: 0.4, ease: 'easeOut', scale: { duration: 0.4 } }
                        : { delay: i * 0.08, duration: 0.25 }
                    }
                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                    whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
                    disabled={isDisabled}
                    onClick={() => submitAnswer(option)}
                    className={`relative px-5 py-5 rounded-2xl text-left font-semibold transition-all duration-200 ${stateClasses}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${pillClasses}`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <p className="text-sm sm:text-base font-bold leading-snug flex-1 pt-1">
                        {option}
                      </p>
                      {visualState === 'selected-correct' && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          className="flex-shrink-0"
                        >
                          <CheckCircle2 className="w-7 h-7 text-white drop-shadow-lg" fill="rgba(255,255,255,0.2)" />
                        </motion.div>
                      )}
                      {visualState === 'selected-wrong' && (
                        <motion.div
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg"
                        >
                          ✕
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating score feedback — "+X pts" or "Wrong" — shoots up and fades */}
        <AnimatePresence>
          {phase === 'answered' && wasCorrect !== null && (
            <motion.div
              key={`feedback-${currentQuestionIndex}`}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-10, -60, -90, -140], scale: [0.5, 1.2, 1, 1] }}
              transition={{ duration: 1.4, ease: 'easeOut', times: [0, 0.2, 0.6, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              {wasCorrect ? (
                <div className="flex flex-col items-center">
                  <span className="text-5xl sm:text-6xl font-black bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]">
                    +{pointsEarned}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-5 h-5 text-amber-300" fill="currentColor" />
                    <span className="text-sm font-black text-emerald-300 tracking-wide uppercase">
                      {pointsEarned >= 90 ? 'Perfect!' : pointsEarned >= 70 ? 'Great!' : 'Nice!'}
                    </span>
                    <Star className="w-5 h-5 text-amber-300" fill="currentColor" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-5xl sm:text-6xl font-black bg-gradient-to-br from-red-400 to-red-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(248,113,113,0.6)]">
                    Oops
                  </span>
                  <span className="text-sm font-black text-red-300 tracking-wide uppercase mt-1">
                    Wrong answer
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
