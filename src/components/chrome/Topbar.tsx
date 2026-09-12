'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { resultHref, searchIndex } from '@/lib/search';
import type { SearchResultItem } from '@/types';
import { useChrome } from './ChromeContext';
import { usePrefs } from '@/lib/preferences';
import type { Accent, SeverityFilter } from '@/types';

const ACCENTS: Array<{ id: Accent; label: string }> = [
  { id: 'emerald', label: 'Emerald green theme' },
  { id: 'ocean', label: 'Ocean blue theme' },
  { id: 'violet', label: 'Violet purple theme' },
  { id: 'rose', label: 'Rose red theme' },
  { id: 'amber', label: 'Amber orange theme' },
  { id: 'teal', label: 'Teal cyan theme' },
];

function SearchBox(): JSX.Element {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    setResults(searchIndex(q));
    setCursor(-1);
    setOpen(q.trim().length >= 2);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent): void => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = (r: SearchResultItem): void => {
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
    router.push(resultHref(r));
  };

  return (
    <div className="searchwrap" ref={boxRef}>
      <span className="search-ico" aria-hidden="true">
        <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      </span>
      <input
        type="search"
        id="searchInput"
        ref={inputRef}
        placeholder="Search a topic or clinical question…"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        inputMode="search"
        aria-label="Search EM Pocket"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(q.trim().length >= 2)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && results.length) {
            e.preventDefault();
            setCursor((c) => (c + 1) % results.length);
          } else if (e.key === 'ArrowUp' && results.length) {
            e.preventDefault();
            setCursor((c) => (c - 1 + results.length) % results.length);
          } else if (e.key === 'Enter' && results.length) {
            e.preventDefault();
            go(results[cursor >= 0 ? cursor : 0]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {q ? (
        <button
          className="search-clear-btn"
          type="button"
          aria-label="Clear search query"
          onClick={() => {
            setQ('');
            inputRef.current?.focus();
          }}
        >
          ✕
        </button>
      ) : null}
      <kbd className="search-kbd" title="Press / to search" aria-hidden="true">/</kbd>
      {open ? (
        <div className="results-pop" id={listId} role="listbox" aria-label="Search results" style={{ display: 'block' }}>
          {results.length ? (
            results.map((r, i) => (
              <button
                key={`${r.cpId}:${r.target}:${r.title}`}
                type="button"
                className={`res-item${i === cursor ? ' active' : ''}`}
                id={`search-result-${i}`}
                data-id={r.cpId}
                data-target={r.target}
                role="option"
                aria-selected={i === cursor}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
              >
                <span className="res-ico" data-cat={r.cpId} aria-hidden="true">
                  {r.cpId === 'ecg' ? '📈' : r.cpId === 'ecg-explorer' ? '🫀' : '•'}
                </span>
                <span className="res-body">
                  <span className="r-title">{r.title}</span>
                  <span className="r-sub">{r.sub}</span>
                </span>
                <span className="r-tag">{r.kind}</span>
              </button>
            ))
          ) : (
            <div className="res-item">
              <div className="r-sub">No results for “{q}”</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SeverityChips(): JSX.Element {
  const { severity, setSeverity } = useChrome();
  const chips: Array<{ id: SeverityFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'emergent', label: 'Emergent' },
    { id: 'common', label: 'Common' },
  ];
  return (
    <div className="chips" id="filterChips" role="group" aria-label="Severity filter">
      {chips.map((c) => (
        <button
          key={c.id}
          className={`chip chip-${c.id}${severity === c.id ? ' active' : ''}`}
          type="button"
          data-sev={c.id}
          aria-pressed={severity === c.id}
          onClick={() => setSeverity(c.id)}
        >
          {c.id !== 'all' ? <span className={`sev-dot sev-${c.id}`} aria-hidden="true" /> : null}
          {c.label}
        </button>
      ))}
    </div>
  );
}

function ReadingTools(): JSX.Element {
  const { prefs, update, fontStep } = usePrefs();
  const [open, setOpen] = useState(false);
  const pct = Math.round(prefs.scale * 100);
  return (
    <>
      <button
        className="tools-toggle"
        id="toolsToggle"
        type="button"
        aria-label={open ? 'Close reading settings' : 'Open reading settings'}
        aria-expanded={open}
        aria-controls="topbarTools"
        onClick={() => setOpen((o) => !o)}
      >
        <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M4 17h16" />
          <circle cx="8" cy="7" r="3" />
          <circle cx="16" cy="17" r="3" />
        </svg>
        <span className="header-label">Reading</span>
      </button>
      <div className={`topbar-tools${open ? ' open' : ''}`} id="topbarTools">
        <div className="pref-tools" role="group" aria-label="Reading options">
          <button type="button" className="pref-btn" id="fontDown" title="Smaller text" aria-label="Smaller text" onClick={() => fontStep(-1)}>A−</button>
          <span className="pref-scale" id="fontLabel">{pct}%</span>
          <button type="button" className="pref-btn" id="fontUp" title="Larger text" aria-label="Larger text" onClick={() => fontStep(1)}>A+</button>
          <button
            type="button"
            className="pref-btn"
            id="boldBtn"
            title="Bold text"
            aria-label="Bold reading text"
            aria-pressed={prefs.bold}
            onClick={() => update({ bold: !prefs.bold })}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="pref-btn"
            id="themeBtn"
            title={prefs.theme === 'light' ? 'Dark mode' : 'Light mode'}
            aria-label={prefs.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-pressed={prefs.theme === 'dark'}
            onClick={() => update({ theme: prefs.theme === 'light' ? 'dark' : 'light' })}
          >
            <span className="theme-ico" aria-hidden="true">
              <svg className="mono-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            </span>
          </button>
        </div>
        <details className="theme-details">
          <summary>Color theme</summary>
          <div className="accent-tools" role="group" aria-label="App color theme">
            <span className="accent-label" id="accentLabel">Color</span>
            <div className="accent-dots" role="group" aria-labelledby="accentLabel">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="accent-dot"
                  data-accent={a.id}
                  title={a.label}
                  aria-label={a.label}
                  aria-pressed={prefs.accent === a.id}
                  onClick={() => update({ accent: a.id })}
                />
              ))}
            </div>
          </div>
        </details>
      </div>
    </>
  );
}

export default function Topbar(): JSX.Element {
  const pathname = usePathname();
  const { setSidebarOpen } = useChrome();
  const nav = pathname === '/' ? 'home'
    : pathname.startsWith('/study') ? 'study'
    : pathname.startsWith('/shift') ? 'shift'
    : pathname.startsWith('/ecg') && !pathname.startsWith('/explorer') ? 'ecg'
    : pathname.startsWith('/explorer') ? 'explorer'
    : pathname.startsWith('/topic') ? 'home'
    : '';

  return (
    <header className="topbar">
      <button
        className="icon-btn burger"
        id="burgerBtn"
        type="button"
        aria-label="Open presentations menu"
        aria-controls="sidebar"
        aria-expanded="false"
        onClick={() => setSidebarOpen(true)}
      >
        <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <nav className="primary-nav" aria-label="Primary navigation">
        <Link className={`home-btn${nav === 'home' ? ' active-nav' : ''}`} id="homeBtn" href="/" title="All presentations (H)" aria-label="All presentations" aria-current={nav === 'home' ? 'page' : undefined}>
          <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1z" />
          </svg>
          <span className="header-label">Presentations</span>
        </Link>
        <Link className={`home-btn utility-btn${nav === 'study' ? ' active-nav' : ''}`} id="studyBtn" href="/study/learn/practice" title="Practice and learning workspace (S)" aria-label="Open practice workspace" aria-current={nav === 'study' ? 'page' : undefined}>
          <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v16M3 3h4a5 5 0 0 1 5 2 5 5 0 0 1 5-2h4v16h-4a5 5 0 0 0-5 2 5 5 0 0 0-5-2H3z" />
          </svg>
          <span className="header-label">Practice</span>
        </Link>
        <Link className={`home-btn utility-btn${nav === 'ecg' ? ' active-nav' : ''}`} id="ecgBtn" href="/ecg" title="ECG Interpretation from scratch (E)" aria-label="Open ECG Guide" aria-current={nav === 'ecg' ? 'page' : undefined}>
          <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h5l3-8 4 16 3-8h5" />
          </svg>
          <span className="header-label">ECG Guide</span>
        </Link>
        <Link className={`home-btn utility-btn${nav === 'explorer' ? ' active-nav' : ''}`} id="explorerBtn" href="/explorer" aria-label="Open ECG Explorer" aria-current={nav === 'explorer' ? 'page' : undefined}>
          <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M4 12h4l2-4 3 8 2-4h5" />
          </svg>
          <span className="header-label">ECG Explorer</span>
        </Link>
        <Link className={`home-btn utility-btn${nav === 'shift' ? ' active-nav' : ''}`} id="shiftBtn" href="/shift" title="Focused shift-ready view (V)" aria-label="Open focused shift view" aria-current={nav === 'shift' ? 'page' : undefined}>
          <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="m13 2-9 12h7l-1 8 10-12h-7z" />
          </svg>
          <span className="header-label">Shift View</span>
        </Link>
      </nav>
      <SearchBox />
      <details className="context-filters">
        <summary>Filter</summary>
        <SeverityChips />
      </details>
      <ReadingTools />
    </header>
  );
}
