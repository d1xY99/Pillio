import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type SettingsDrawerContextValue = {
  open: boolean;
  show: () => void;
  hide: () => void;
};

const SettingsDrawerContext = createContext<SettingsDrawerContextValue | null>(null);

export function SettingsDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, show, hide }), [open, show, hide]);
  return <SettingsDrawerContext.Provider value={value}>{children}</SettingsDrawerContext.Provider>;
}

export function useSettingsDrawer() {
  const ctx = useContext(SettingsDrawerContext);
  if (!ctx) throw new Error('useSettingsDrawer must be used inside SettingsDrawerProvider');
  return ctx;
}
