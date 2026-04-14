'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verified?: boolean;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-28 h-28 text-2xl',
};

export function Avatar({ src, alt, size = 'md', verified }: AvatarProps) {
  return (
    <div className={cn('relative rounded-2xl overflow-hidden bg-gradient-to-br from-cupid-100 to-cupid-200 dark:from-cupid-900/30 dark:to-cupid-800/30 flex-shrink-0 shadow-sm', sizes[size])}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-cupid-500 font-bold">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        </div>
      )}
    </div>
  );
}
