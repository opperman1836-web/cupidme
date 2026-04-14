'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-4 py-3 text-dark-900 dark:text-dark-100 placeholder:text-dark-400 dark:placeholder:text-dark-500 transition-all',
            'focus:border-cupid-500 focus:ring-2 focus:ring-cupid-200 dark:focus:ring-cupid-800 focus:outline-none',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
