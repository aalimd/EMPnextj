'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Accent, Prefs, Theme } from '@/types';

const PREFS_KEY = 'em-cps-prefs';
const DISCLAIMER_KEY = 'em-cps-disclaimer-agreed';

const ACCENTS: Accent[] = ['emerald', 'ocean', 'violet', 'rose', 'amber', 'teal'];
const SCALE_STEPS = [0.85, 1, 1.12, 1.25, 1.4];

function nearestScale(v: unknown): number {
  const n = Number(v) || 1;
  let best = 1;
  let distance = Infinity;
  for (const s of SCALE_STEPS) {
    const d = Math.abs(s - n);
    if (d < distance) {
      distance = d;
      best = s;
    }
  }
  return best;
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'light',
  accent: 'emerald',
  bold: false,
  scale: 1,
  sidebar: false,
};

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: p.theme === 'dark' ? 'dark' : 'light',
      accent: ACCENTS.includes(p.accent as Accent) ? (p.accent as Accent) : 'emerald',
      bold: p.bold === true,
      scale: nearestScale(p.scale),
      sidebar: p.sidebar === true,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function applyPrefs(p: Prefs): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', p.theme);
  root.setAttribute('data-accent', p.accent);
  if (p.bold) root.setAttribute('data-weight', 'bold');
  else root.removeAttribute('data-weight');
  root.style.setProperty('--type-scale', String(p.scale));
  root.classList.toggle('sidebar-collapsed', p.sidebar);
  const meta = document.getElementById('themeColor');
  if (meta) meta.setAttribute('content', p.theme === 'light' ? '#ffffff' : '#151d27');
}

interface PrefsContextValue {
  prefs: Prefs;
  update: (patch: Partial<Prefs>) => void;
  fontStep: (dir: 1 | -1) => void;
  disclaimerAgreed: boolean;
  agreeDisclaimer: () => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs());
    let agreed = false;
    try {
      agreed = localStorage.getItem(DISCLAIMER_KEY) === '1';
    } catch {
      agreed = false;
    }
    setDisclaimerAgreed(agreed);
    try {
      if (agreed) document.documentElement.removeAttribute('data-disclaimer');
      else document.documentElement.setAttribute('data-disclaimer', 'pending');
    } catch {
      /* attribute is best-effort */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyPrefs(prefs);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* Storage may be blocked; preferences apply for this session only. */
    }
  }, [prefs, hydrated]);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const fontStep = useCallback((dir: 1 | -1) => {
    setPrefs((prev) => {
      const i = SCALE_STEPS.indexOf(prev.scale);
      const base = i === -1 ? 1 : i;
      const next = SCALE_STEPS[Math.min(SCALE_STEPS.length - 1, Math.max(0, base + dir))];
      return { ...prev, scale: next };
    });
  }, []);

  const agreeDisclaimer = useCallback(() => {
    try {
      localStorage.setItem(DISCLAIMER_KEY, '1');
    } catch {
      /* Agreement applies for this session only when storage is blocked. */
    }
    try {
      document.documentElement.removeAttribute('data-disclaimer');
    } catch {
      /* attribute is best-effort */
    }
    setDisclaimerAgreed(true);
  }, []);

  return (
    <PrefsContext.Provider value={{ prefs, update, fontStep, disclaimerAgreed, agreeDisclaimer }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider');
  return ctx;
}
