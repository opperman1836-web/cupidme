import { ProfileCardSkeleton } from '@/components/ui/Skeleton';

export default function DiscoverLoading() {
  return (
    <div className="max-w-md mx-auto" style={{ minHeight: '85vh' }}>
      <div className="relative" style={{ height: '74vh', maxHeight: '660px' }}>
        <ProfileCardSkeleton />
      </div>
      <div className="flex items-center justify-center gap-4 mt-5">
        <div className="w-16 h-16 rounded-full bg-dark-200 dark:bg-dark-700 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-dark-200 dark:bg-dark-700 animate-pulse" />
        <div className="w-20 h-20 rounded-full bg-dark-200 dark:bg-dark-700 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-dark-200 dark:bg-dark-700 animate-pulse" />
        <div className="w-16 h-16 rounded-full bg-dark-200 dark:bg-dark-700 animate-pulse" />
      </div>
    </div>
  );
}
