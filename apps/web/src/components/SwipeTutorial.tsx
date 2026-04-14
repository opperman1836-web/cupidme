'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const TUTORIAL_KEY = 'cupidme-tutorial-seen';

export function SwipeTutorial() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShow(false);
  }

  if (!show) return null;

  const steps = [
    {
      icon: <Heart className="w-12 h-12 text-white fill-white" />,
      bg: 'from-cupid-400 to-cupid-600',
      title: 'Welcome to CupidMe!',
      subtitle: 'Discover people nearby and find your match',
    },
    {
      icon: <ArrowRight className="w-12 h-12 text-emerald-400" />,
      bg: 'from-emerald-400 to-emerald-600',
      title: 'Swipe right to like',
      subtitle: 'Drag the card right or tap the heart button',
    },
    {
      icon: <ArrowLeft className="w-12 h-12 text-red-400" />,
      bg: 'from-red-400 to-red-600',
      title: 'Swipe left to pass',
      subtitle: 'Not feeling it? Swipe left or tap X',
    },
    {
      icon: <Sparkles className="w-12 h-12 text-amber-400" />,
      bg: 'from-amber-400 to-purple-600',
      title: 'Match & Duel!',
      subtitle: 'When you both like each other, challenge them to a Cupid Duel',
    },
  ];

  const current = steps[step];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="bg-white dark:bg-dark-900 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl"
          >
            <div className={`w-20 h-20 bg-gradient-to-br ${current.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
              {current.icon}
            </div>

            <h2 className="text-2xl font-black text-dark-900 dark:text-white mb-2">
              {current.title}
            </h2>
            <p className="text-dark-500 text-sm mb-8">
              {current.subtitle}
            </p>

            {/* Step dots */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === step ? 'w-6 bg-cupid-500' : 'bg-dark-200 dark:bg-dark-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {step < steps.length - 1 ? (
                <>
                  <Button variant="ghost" onClick={dismiss} className="flex-1 text-dark-400">
                    Skip
                  </Button>
                  <Button onClick={() => setStep(step + 1)} className="flex-1">
                    Next
                  </Button>
                </>
              ) : (
                <Button onClick={dismiss} className="w-full bg-gradient-to-r from-cupid-500 to-purple-600">
                  <Sparkles className="w-4 h-4 mr-2" /> Start Swiping!
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
