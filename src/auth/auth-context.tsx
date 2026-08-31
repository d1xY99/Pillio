import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { apiGet, apiPost, isApiConfigured } from '@/api/client';
import { readSession, writeSession, type ApiSession, type ApiUser } from '@/api/session';
import { clearLocalUserData, pullFromCloud, resetCloudPullState } from '@/sync/cloud';

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
  const hydratedUser = useRef<string | null>(null);

  async function hydrateFromCloud(uid: string) {
    if (hydrateLock.current) return hydrateLock.current;
    if (hydratedUser.current === uid) {
      setHydrating(false);
      return;
    }
    setHydrating(true);
    hydrateLock.current = (async () => {
      try {
        await pullFromCloud();
        const { syncDoseReminders } = await import('@/notifications/sync');
        await syncDoseReminders();
        hydratedUser.current = uid;
      } catch {
        // keep local cache
      } finally {
        hydrateLock.current = null;
        setHydrating(false);
      }
    })();
    return hydrateLock.current;
  }

  useEffect(() => {
    const saved = readSession();
    if (!saved?.access_token) {
      setLoading(false);
      return;
    }
    setSession(saved);
    setHydrating(true);
    void (async () => {
      try {
        const me = await apiGet<{ user: ApiUser }>('/auth/me');
        setUser(me.user);
        setLoading(false);
        await hydrateFromCloud(me.user.id);
      } catch {
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
          writeSession(data.session);
          setSession(data.session);
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
          writeSession(data.session);
          setSession(data.session);
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
        hydratedUser.current = null;
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
