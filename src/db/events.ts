type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeDb(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDbChanged() {
  for (const listener of listeners) listener();
}
