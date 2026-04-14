import { CardSkeleton } from '@/components/ui/Skeleton';

export default function MatchesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-dark-200 dark:bg-dark-700 rounded animate-pulse" />
          <div className="h-4 w-20 bg-dark-200 dark:bg-dark-700 rounded animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-dark-200 dark:bg-dark-700 rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-1 bg-dark-100 dark:bg-dark-800 rounded-2xl p-1 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-9 bg-dark-200 dark:bg-dark-700 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid gap-3">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
