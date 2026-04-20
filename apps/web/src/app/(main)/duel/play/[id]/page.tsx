'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Clock, Zap, CheckCircle2, Trophy, ArrowRight, Star,
  Hourglass, Check, X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useDuelStore } from '@/stores/duelStore';
import { useDuelRealtime } from '@/hooks/useDuelRealtime';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';

type Phase =
  | 'loading'
  | 'pending_inviter'   // I created this; waiting for the other person to accept
  | 'pending_invitee'   // I was invited; need to accept or reject
  | 'ready'             // Accepted, awaiting first /start call
  | 'countdown'
  | 'question'
  | 'answered'
  | 'completing'
  | 'done'
  | 'terminal';         // rejected / expired / cancelled

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
  const [terminalMsg, setTerminalMsg] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [timer, setTimer] = useState(15);
  const [countdownNum, setCountdownNum] = useState(3);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initial load — read duel state, then route to appropriate phase
  useEffect(() => {
    async function loadDuel() {
      if (!token || !duelId) return;
      try {
        const res = await api.get<any>(`/api/duels/${duelId}`, token);
        const d = res.data;
        setDuelLocal(d);
        setDuel(d);

        const isPractice = d.user1_id === d.user2_id;
        const iAmInviter = d.user1_id === userId;

        switch (d.status) {
          case 'pending':
            // Practice always auto-accepts on the backend, so 'pending' here
            // is always a real invitation
            setPhase(iAmInviter ? 'pending_inviter' : 'pending_invitee');
            break;

          case 'accepted':
            // Practice creates as 'accepted', so auto-start it for the inviter.
            if (isPractice) {
              await beginGame();
            } else {
              setPhase('ready');
            }
            break;

          case 'active': {
            // Resume mid-game
            const startRes = await api.post<any>(`/api/duels/${duelId}/start`, {}, token);
            const { duel: dd, questions: q } = startRes.data;
            setDuelLocal(dd);
            setDuel(dd);
            setQuestions(q);
            setPhase('countdown');
            setCountdownNum(3);
            break;
          }

          case 'completed':
            router.push(`/duel/result/${duelId}`);
            return;

          case 'rejected':
            setTerminalMsg('This duel was declined.');
            setPhase('terminal');
            break;
          case 'cancelled':
            setTerminalMsg('This duel was cancelled.');
            setPhase('terminal');
            break;
          case 'expired':
            setTerminalMsg('This duel expired without being started.');
            setPhase('terminal');
            break;

          default:
            setTerminalMsg(`Duel is in an unexpected state: ${d.status}.`);
            setPhase('terminal');
        }
      } catch (err: any) {
        addToast(err?.message || 'Failed to load duel', 'error');
        router.push('/duel/invite');
      }
    }

    reset();
    loadDuel();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, duelId, userId]);

  // ── Begin gameplay (called after Accepted → Start, or auto for practice) ──
  async function beginGame() {
    setActionLoading(true);
    try {
      const res = await api.post<any>(`/api/duels/${duelId}/start`, {}, token!);
      const { duel: d, questions: q } = res.data;
      setDuelLocal(d);
      setDuel(d);
      setQuestions(q);
      setPhase('countdown');
      setCountdownNum(3);
    } catch (err: any) {
      addToast(err?.message || 'Failed to start duel', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAccept() {
    setActionLoading(true);
    try {
      await api.post(`/api/duels/${duelId}/accept`, {}, token!);
      addToast('Challenge accepted!', 'success');
      await beginGame();
    } catch (err: any) {
      addToast(err?.message || 'Failed to accept', 'error');
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setActionLoading(true);
    try {
      await api.post(`/api/duels/${duelId}/reject`, {}, token!);
      addToast('Challenge declined', 'success');
      router.push('/duel/invite');
    } catch (err: any) {
      addToast(err?.message || 'Failed to reject', 'error');
      setActionLoading(false);
    }
  }

  // Inviter polls for acceptance every 5s while in pending_inviter
  useEffect(() => {
    if (phase !== 'pending_inviter') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get<any>(`/api/duels/${duelId}`, token!);
        const d = res.data;
        if (d.status === 'accepted') {
          setDuelLocal(d);
          setPhase('ready');
        } else if (d.status === 'rejected' || d.status === 'cancelled' || d.status === 'expired') {
          setDuelLocal(d);
          setTerminalMsg(
            d.status === 'rejected' ? 'Your opponent declined this duel.' :
            d.status === 'expired'  ? 'This duel expired.' : 'This duel was cancelled.'
          );
          setPhase('terminal');
        }
      } catch {/* network blip — try again */}
    }, 5000);
    return () => clearInterval(interval);
  }, [phase, duelId, token]);

  // Countdown effect
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) {
      haptic([50, 50, 100]);
      setPhase('question');
      startTimer();
      return;
    }
    haptic(20);
    const t = setTimeout(() => setCountdownNum((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (submitting) return;
    if (selectedOption) return;
    const q = questions[currentQuestionIndex];
    if (q) {
      await submitAnswer(q.option_a);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions, selectedOption, submitting]);

  async function submitAnswer(answer: string) {
    const q = questions[currentQuestionIndex];
    if (!q || submitting) return;
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
      addScore(pts);
      setPointsEarned(pts);
      // For compatibility duels, "correct" means answered fast enough to score.
      // The real compatibility bonus is awarded at completion based on opponent's answers.
      setWasCorrect(pts > 0);
      addAnswer(res.data.answer);

      if (pts > 0) haptic([40, 30, 40]); else haptic(120);
      setPhase('answered');

      setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
          nextQuestion();
          setSelectedOption(null);
          setPointsEarned(0);
          setWasCorrect(null);
          setSubmitting(false);
          setPhase('countdown');
          setCountdownNum(1);
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

  // ════════════════════════════════════════════════════
  // ── PRE-GAME PHASES ──
  // ════════════════════════════════════════════════════

  // Loading
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Swords className="w-16 h-16 text-cupid-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
        </motion.div>
      </div>
    );
  }

  // Inviter waiting on opponent's response
  if (phase === 'pending_inviter') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(245,158,11,0.35)]"
          >
            <Hourglass className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-3">Waiting for your opponent</h1>
          <p className="text-dark-300 leading-relaxed">
            Your challenge has been sent. The duel will start as soon as they accept.
            We&apos;ll keep checking — feel free to leave; we&apos;ll notify you.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/duel/invite')}
            className="mt-8 !text-white !border-white/20 hover:!bg-white/10"
          >
            Back to Duels
          </Button>
        </motion.div>
      </div>
    );
  }

  // Invitee deciding
  if (phase === 'pending_invitee') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-cupid-400 to-cupid-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(244,63,94,0.35)]">
            <Swords className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">You&apos;ve been challenged!</h1>
          <p className="text-dark-300 leading-relaxed">
            Accept to play a {duel?.type?.replace('_', ' ') || 'compatibility'} duel — answer 5 questions
            and discover how compatible you really are.
          </p>
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={handleReject}
              loading={actionLoading}
              className="flex-1 !text-white !border-white/20 hover:!bg-white/10"
            >
              <X className="w-4 h-4 mr-2" /> Decline
            </Button>
            <Button
              onClick={handleAccept}
              loading={actionLoading}
              className="flex-1 bg-gradient-to-r from-cupid-500 to-purple-600 text-white"
            >
              <Check className="w-4 h-4 mr-2" /> Accept
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Accepted but not yet started by this client
  if (phase === 'ready') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Ready to duel</h1>
          <p className="text-dark-300 leading-relaxed">
            5 questions. 15 seconds each. Speed matters — and so do shared answers.
            Tap Start when you&apos;re ready.
          </p>
          <Button
            onClick={beginGame}
            loading={actionLoading}
            className="mt-8 w-full bg-gradient-to-r from-cupid-500 to-purple-600 text-white !py-4"
          >
            <Swords className="w-5 h-5 mr-2" />
            Start Duel
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // Terminal (rejected / expired / cancelled)
  if (phase === 'terminal') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-24 h-24 bg-dark-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-dark-300" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Duel ended</h1>
          <p className="text-dark-300 leading-relaxed">{terminalMsg}</p>
          <Button
            onClick={() => router.push('/duel/invite')}
            className="mt-8 bg-gradient-to-r from-cupid-500 to-purple-600 text-white"
          >
            Back to Duels
          </Button>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // ── COUNTDOWN / GAMEPLAY ──
  // ════════════════════════════════════════════════════

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

  if (phase === 'completing' || phase === 'done') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
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
            Your speed score:{' '}
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cupid-400 to-purple-400">
              {myScore}
            </span>
          </p>
          {phase === 'done' && (
            <>
              <p className="text-sm text-dark-400 mb-6 max-w-xs mx-auto">
                Your opponent is still playing. The compatibility bonus is added once they finish.
              </p>
              <Button
                onClick={() => router.push(`/duel/result/${duelId}`)}
                className="bg-gradient-to-r from-cupid-500 to-cupid-600 text-white shadow-xl shadow-cupid-500/30"
              >
                View Results <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // Gameplay
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 overflow-y-auto">
      <div className="absolute top-0 -right-20 w-80 h-80 bg-cupid-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-5 pt-6 pb-10">
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

        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-8 border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-cupid-400 via-cupid-500 to-purple-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)]"
            initial={{ width: `${progress}%` }}
            animate={{ width: `${((currentQuestionIndex + (phase === 'answered' ? 1 : 0)) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

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

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ?.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((option, i) => {
                const isSelected = selectedOption === option;
                const isAnswered = phase === 'answered';
                const isDisabled = isAnswered || submitting;

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
                      <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${pillClasses}`}>
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

        <AnimatePresence>
          {phase === 'answered' && wasCorrect !== null && (
            <motion.div
              key={`feedback-${currentQuestionIndex}`}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-10, -60, -90, -140], scale: [0.5, 1.2, 1, 1] }}
              transition={{ duration: 1.4, ease: 'easeOut', times: [0, 0.2, 0.6, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              {wasCorrect && pointsEarned > 0 ? (
                <div className="flex flex-col items-center">
                  <span className="text-5xl sm:text-6xl font-black bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]">
                    +{pointsEarned}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-5 h-5 text-amber-300" fill="currentColor" />
                    <span className="text-sm font-black text-emerald-300 tracking-wide uppercase">
                      Speed bonus
                    </span>
                    <Star className="w-5 h-5 text-amber-300" fill="currentColor" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-5xl sm:text-6xl font-black bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                    +0
                  </span>
                  <span className="text-sm font-black text-amber-300 tracking-wide uppercase mt-1">
                    Too slow — no speed bonus
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
