import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { apiGet, apiPost, isApiConfigured } from '@/api/client';
import { readSession, writeSession, type ApiSession, type ApiUser } from '@/api/session';
import { adoptUser, clearLocalUserData, pullFromCloud, resetCloudPullState } from '@/sync/cloud';

type AuthContextValue = {
  configured: boolean;
  session: ApiSession | null;
  user: ApiUser | null;
  loading: boolean;
  hydrating: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isApiConfigured();
  const [session, setSession] = useState<ApiSession | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(configured);
  const [hydrating, setHydrating] = useState(false);
  const hydrateLock = useRef<Promise<void> | null>(null);

  async function hydrateFromCloud(uid: string) {
    if (hydrateLock.current) return hydrateLock.current;
    setHydrating(true);
    hydrateLock.current = (async () => {
      try {
        await adoptUser(uid);
        await pullFromCloud();
        const { syncDoseReminders } = await import('@/notifications/sync');
        await syncDoseReminders();
      } catch {
        // same-user network blip: keep that account's cache
      } finally {
        hydrateLock.current = null;
        setHydrating(false);
      }
    })();
    return hydrateLock.current;
  }

  useEffect(() => {
    const saved = readSession();
    if (saved?.user) setUser(saved.user);
    if (saved) setSession(saved);

    void (async () => {
      try {
        const data = await apiPost<{ session?: ApiSession; user: ApiUser }>('/auth/session', {
          refreshToken: saved?.refresh_token,
        });
        if (data.session) {
          writeSession({ ...data.session, user: data.user });
          setSession({ ...data.session, user: data.user });
        }
        setUser(data.user);
        setLoading(false);
        await hydrateFromCloud(data.user.id);
      } catch {
        if (saved?.user && saved.refresh_token) {
          setUser(saved.user);
          setSession(saved);
          setLoading(false);
          setHydrating(false);
          return;
        }
        writeSession(null);
        setSession(null);
        setUser(null);
        setLoading(false);
        setHydrating(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      session,
      user,
      loading,
      hydrating,
      signIn: async (email, password) => {
        try {
          const data = await apiPost<{ session: ApiSession; user: ApiUser }>('/auth/sign-in', {
            email,
            password,
          });
          writeSession({ ...data.session, user: data.user });
          setSession({ ...data.session, user: data.user });
          setUser(data.user);
          await hydrateFromCloud(data.user.id);
          return null;
        } catch (error) {
          return error instanceof Error ? error.message : 'Could not sign in';
        }
      },
      signUp: async (name, email, password) => {
        try {
          const data = await apiPost<{
            session?: ApiSession;
            user?: ApiUser;
            needsConfirmation?: boolean;
          }>('/auth/sign-up', { name, email, password });
          if (data.needsConfirmation || !data.session || !data.user) {
            return 'Check your email to confirm the account, then sign in.';
          }
          writeSession({ ...data.session, user: data.user });
          setSession({ ...data.session, user: data.user });
          setUser(data.user);
          await hydrateFromCloud(data.user.id);
          return null;
        } catch (error) {
          return error instanceof Error ? error.message : 'Could not create account';
        }
      },
      signOut: async () => {
        try {
          await apiPost('/auth/sign-out', {});
        } catch {
          // still leave
        }
        resetCloudPullState();
        writeSession(null);
        setSession(null);
        setUser(null);
        await clearLocalUserData();
      },
    }),
    [configured, session, user, loading, hydrating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
