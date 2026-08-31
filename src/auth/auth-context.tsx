import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { cancelScheduledPush, clearLocalUserData, pullFromCloud, pushToCloud } from '@/sync/cloud';

type AuthContextValue = {
  configured: boolean;
  session: Session | null;
  user: User | null;
  loading: boolean;
  hydrating: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const [hydrating, setHydrating] = useState(false);
  const hydrateLock = useRef<Promise<void> | null>(null);

  async function hydrateFromCloud() {
    if (hydrateLock.current) return hydrateLock.current;
    setHydrating(true);
    hydrateLock.current = (async () => {
      try {
        await pullFromCloud();
        const { ensureUpcomingDoses } = await import('@/domain/doses');
        ensureUpcomingDoses();
        const { notifyDbChanged } = await import('@/db/events');
        notifyDbChanged();
        const { syncDoseReminders } = await import('@/notifications/sync');
        await syncDoseReminders();
        await pushToCloud();
      } catch {
        // show whatever is already on this phone
      } finally {
        hydrateLock.current = null;
        setHydrating(false);
      }
    })();
    return hydrateLock.current;
  }

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session) {
        setHydrating(true);
        setLoading(false);
        void hydrateFromCloud();
      } else {
        setLoading(false);
      }
    });

    let hadSession = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (next) hadSession = true;
      if (event === 'INITIAL_SESSION') setLoading(false);
      if (next && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setHydrating(true);
        setLoading(false);
      }
      if (event === 'SIGNED_OUT') {
        setHydrating(false);
        setLoading(false);
      }
      // Defer so we never call auth APIs while this callback holds the lock.
      setTimeout(() => {
        if (event === 'SIGNED_OUT') {
          if (hadSession) void clearLocalUserData();
          return;
        }
        if (next && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          void hydrateFromCloud();
        }
      }, 0);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      session,
      user: session?.user ?? null,
      loading,
      hydrating,
      signIn: async (email, password) => {
        const supabase = getSupabase();
        if (!supabase) return 'Cloud backup is not configured.';
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return error.message;
        await hydrateFromCloud();
        return null;
      },
      signUp: async (name, email, password) => {
        const supabase = getSupabase();
        if (!supabase) return 'Cloud backup is not configured.';
        const displayName = name.trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) return error.message;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            display_name: displayName,
          });
        }
        if (!data.session) {
          return 'Check your email to confirm the account, then sign in.';
        }
        await hydrateFromCloud();
        return null;
      },
      signOut: async () => {
        cancelScheduledPush();
        try {
          await pushToCloud();
        } catch {
          // still leave this phone even if the last backup fails
        }
        await getSupabase()?.auth.signOut();
        await clearLocalUserData();
      },
    }),
    [configured, session, loading, hydrating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
