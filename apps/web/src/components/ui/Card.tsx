'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-800 shadow-sm p-6',
        hover && 'hover:shadow-lg hover:border-cupid-200 dark:hover:border-cupid-800 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
