'use client';

import { useSyncExternalStore } from 'react';
import { getInboundRequestCount, subscribeRequestLoading } from '@/lib/request-loading';
import { cn } from '@/lib/cn';

export function GlobalLoadingBar() {
  const pending = useSyncExternalStore(subscribeRequestLoading, getInboundRequestCount, () => 0);

  if (pending <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-brand-600/15 dark:bg-brand-400/20"
      aria-hidden
    >
      <div
        className={cn(
          'h-full w-[35%] max-w-[280px] rounded-r-full bg-brand-600 dark:bg-brand-400',
          'animate-nb-load-bar motion-reduce:animate-none motion-reduce:opacity-90',
        )}
      />
    </div>
  );
}
