import { Skeleton } from '@/components/ui/Skeleton';

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex items-center gap-3 pb-4 border-b border-dark-100 dark:border-dark-800">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex-1 py-4 space-y-4">
        <div className="flex justify-end"><Skeleton className="h-10 w-48 rounded-2xl" /></div>
        <div className="flex justify-start"><Skeleton className="h-10 w-56 rounded-2xl" /></div>
        <div className="flex justify-end"><Skeleton className="h-10 w-40 rounded-2xl" /></div>
        <div className="flex justify-start"><Skeleton className="h-16 w-64 rounded-2xl" /></div>
      </div>
      <div className="pt-3 border-t border-dark-100 dark:border-dark-800">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
