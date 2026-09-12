'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { PatientFilter, SeverityFilter } from '@/types';

interface ChromeState {
  severity: SeverityFilter;
  setSeverity: (s: SeverityFilter) => void;
  patient: PatientFilter;
  setPatient: (p: PatientFilter) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const ChromeContext = createContext<ChromeState | null>(null);

export function ChromeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [patient, setPatient] = useState<PatientFilter>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <ChromeContext.Provider
      value={{ severity, setSeverity, patient, setPatient, sidebarOpen, setSidebarOpen, toast, showToast }}
    >
      {children}
    </ChromeContext.Provider>
  );
}

export function useChrome(): ChromeState {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error('useChrome must be used within ChromeProvider');
  return ctx;
}
