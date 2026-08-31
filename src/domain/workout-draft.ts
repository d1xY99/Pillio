import { useEffect, useState } from 'react';

const extras: Record<string, string[]> = {};
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function addDraftExercise(sessionId: string, exerciseId: string) {
  extras[sessionId] = [...new Set([...(extras[sessionId] ?? []), exerciseId])];
  emit();
}

export function useDraftExercises(sessionId: string): string[] {
  const [ids, setIds] = useState(extras[sessionId] ?? []);

  useEffect(() => {
    const listener = () => setIds(extras[sessionId] ?? []);
    listener();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [sessionId]);

  return ids;
}
