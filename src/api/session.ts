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

function webStorage(kind: 'local' | 'session') {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function parse(raw: string | null): ApiSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as ApiSession;
    if (!value?.access_token && !value?.refresh_token) return null;
    return value;
  } catch {
    return null;
  }
}

export function readSession(): ApiSession | null {
  return parse(webStorage('local')?.getItem(KEY) ?? null) || parse(webStorage('session')?.getItem(KEY) ?? null);
}

export function writeSession(session: ApiSession | null) {
  const local = webStorage('local');
  const sessionStore = webStorage('session');
  if (!session) {
    local?.removeItem(KEY);
    sessionStore?.removeItem(KEY);
    return;
  }
  const raw = JSON.stringify(session);
  try {
    local?.setItem(KEY, raw);
  } catch {
    // iOS private / quota
  }
  try {
    sessionStore?.setItem(KEY, raw);
  } catch {
    // ignore
  }
}

export function accessToken() {
  return readSession()?.access_token ?? null;
}

export function refreshToken() {
  return readSession()?.refresh_token ?? null;
}

export function readLocalOwner(): string | null {
  return webStorage('local')?.getItem(OWNER_KEY) ?? webStorage('session')?.getItem(OWNER_KEY) ?? null;
}

export function writeLocalOwner(userId: string | null) {
  const local = webStorage('local');
  const sessionStore = webStorage('session');
  if (!userId) {
    local?.removeItem(OWNER_KEY);
    sessionStore?.removeItem(OWNER_KEY);
    return;
  }
  try {
    local?.setItem(OWNER_KEY, userId);
  } catch {
    try {
      sessionStore?.setItem(OWNER_KEY, userId);
    } catch {
      // iOS private / quota
    }
  }
}
