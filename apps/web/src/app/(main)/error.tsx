'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-dark-800 dark:text-dark-200 mb-2">
          Something went wrong
        </h2>
        <p className="text-dark-500 text-sm max-w-sm mx-auto mb-8">
          We hit an unexpected error. Try again or head back to the main page.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Button onClick={() => window.location.href = '/discover'}>
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
