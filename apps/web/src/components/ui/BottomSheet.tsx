'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max height as vh (default: 85) */
  maxHeight?: number;
}

/**
 * Drag-to-dismiss bottom sheet with backdrop blur.
 * Uses framer-motion drag="y" — swipe down to close.
 */
export function BottomSheet({ isOpen, onClose, children, maxHeight = 85 }: BottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  function handleDragEnd(_: any, info: PanInfo) {
    // Dismiss if dragged down >120px or with velocity >500
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            style={{ maxHeight: `${maxHeight}vh` }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-dark-900 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col touch-none"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-dark-200 dark:bg-dark-700 rounded-full" />
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
