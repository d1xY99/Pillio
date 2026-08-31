import { useEffect, useState } from 'react';

import { subscribeDb } from '@/db/events';

export function useLiveQuery<T>(query: T, deps: unknown[] = []) {
  const [data, setData] = useState<Awaited<T> | []>([]);
  const [error, setError] = useState<Error | undefined>();
  const [updatedAt, setUpdatedAt] = useState<Date | undefined>();

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      try {
        Promise.resolve(query as PromiseLike<Awaited<T>>)
          .then((result) => {
            if (cancelled) return;
            setData(result);
            setUpdatedAt(new Date());
            setError(undefined);
          })
          .catch((cause) => {
            if (!cancelled) setError(cause instanceof Error ? cause : new Error(String(cause)));
          });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    };

    run();
    const unsubscribe = subscribeDb(run);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, deps);

  return { data, error, updatedAt };
}
