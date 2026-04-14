'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const base = 'animate-pulse bg-dark-200 dark:bg-dark-700 rounded';
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
  };

  return <div className={cn(base, variants[variant], className)} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-900 rounded-2xl p-4 border border-dark-100 dark:border-dark-800">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-16 h-16 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="w-full rounded-3xl overflow-hidden bg-dark-200 dark:bg-dark-800 animate-pulse relative" style={{ height: '74vh', maxHeight: '660px' }}>
      <div className="absolute bottom-0 inset-x-0 p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
