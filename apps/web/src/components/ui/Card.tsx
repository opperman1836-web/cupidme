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
        'rounded-2xl bg-white border border-dark-100 shadow-sm p-6',
        hover && 'hover:shadow-md hover:border-cupid-200 transition-all cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
