import { Platform } from 'react-native';

const KEY = 'pillio.auth';
const OWNER_KEY = 'pillio.localOwner';

export type ApiUser = {
  id: string;
  email: string | null;
  displayName: string;
};

export type ApiSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user?: ApiUser;
};

function storage() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window.localStorage;
}

export function readSession(): ApiSession | null {
  const raw = storage()?.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiSession;
  } catch {
    return null;
  }
}

export function writeSession(session: ApiSession | null) {
  const store = storage();
  if (!store) return;
  if (!session) store.removeItem(KEY);
  else store.setItem(KEY, JSON.stringify(session));
}

export function accessToken() {
  return readSession()?.access_token ?? null;
}

export function refreshToken() {
  return readSession()?.refresh_token ?? null;
}

export function readLocalOwner(): string | null {
  return storage()?.getItem(OWNER_KEY) ?? null;
}

export function writeLocalOwner(userId: string | null) {
  const store = storage();
  if (!store) return;
  if (!userId) store.removeItem(OWNER_KEY);
  else store.setItem(OWNER_KEY, userId);
}
