export type ToastAction = { label: string; onPress: () => void };

export type Toast = {
  id: number;
  message: string;
  action?: ToastAction;
  duration: number;
};

type Listener = (toast: Toast | null) => void;

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<Listener>();

export function showToast(
  message: string,
  options: { action?: ToastAction; duration?: number } = {},
) {
  current = { id: nextId++, message, action: options.action, duration: options.duration ?? 5000 };
  for (const listener of listeners) listener(current);
}

export function dismissToast() {
  current = null;
  for (const listener of listeners) listener(null);
}

export function subscribeToast(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}
