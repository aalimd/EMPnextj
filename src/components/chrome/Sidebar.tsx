'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { TOPICS } from '@/data/topics';
import { GROUPS } from '@/lib/libraryMeta';
import { useChrome } from './ChromeContext';
import { usePrefs } from '@/lib/preferences';
import TopicIcon from '@/components/library/TopicIcon';

export default function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useChrome();
  const { prefs, update } = usePrefs();

  const activeTopic = pathname.startsWith('/topic/') ? pathname.split('/')[2] : null;
  const onHome = pathname === '/';
  const collapsed = prefs.sidebar;

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen, setSidebarOpen]);

  // Hidden drawer/rail must not keep focus inside an inert ancestor
  // (Chrome: "Blocked aria-hidden on an element because its descendant retained focus").
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 920px)');
    const sync = (): void => {
      const el = document.getElementById('sidebar');
      if (!el) return;
      const hidden = (mq.matches && !sidebarOpen) || (!mq.matches && collapsed);
      if (hidden) {
        const active = document.activeElement;
        if (active instanceof HTMLElement && el.contains(active)) {
          active.blur();
          const stage = document.getElementById('stage');
          if (stage instanceof HTMLElement) stage.focus({ preventScroll: true });
        }
      }
      const sidebar = el as HTMLElement & { inert?: boolean };
      try {
        if (typeof sidebar.inert === 'boolean') {
          sidebar.inert = hidden;
          sidebar.removeAttribute('aria-hidden');
        } else if (hidden) {
          sidebar.setAttribute('aria-hidden', 'true');
        } else {
          sidebar.removeAttribute('aria-hidden');
        }
      } catch {
        if (hidden) sidebar.setAttribute('aria-hidden', 'true');
        else sidebar.removeAttribute('aria-hidden');
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [sidebarOpen, collapsed]);

  return (
    <>
      <nav
        className={`sidebar${sidebarOpen ? ' open' : ''}`}
        id="sidebar"
        aria-label="Presentations"
      >
        <div className="side-head">
          <Link className="brand" id="brandBtn" href="/" title="All presentations" onClick={() => setSidebarOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="" width="44" height="44" />
            </span>
            <span className="brand-text">
              <strong>EM Pocket</strong>
              <span>Emergency medicine</span>
            </span>
          </Link>
          <button
            className="collapse-btn"
            id="collapseBtn"
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => update({ sidebar: !collapsed })}
          >
            <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="m14 6-6 6 6 6" />
            </svg>
          </button>
        </div>
        <div className="side-list" id="sideList">
          <Link
            href="/"
            className={`side-item side-home${onHome ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="ico" data-cat="home" aria-hidden="true">
              <svg className="mono-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1z" />
              </svg>
            </i>
            All presentations<span className="side-count">{TOPICS.length}</span>
          </Link>
          {GROUPS.map((g, gi) => {
            const items = g.ids
              .map((id) => TOPICS.find((t) => t.id === id))
              .filter((t): t is (typeof TOPICS)[number] => Boolean(t));
            if (!items.length) return null;
            const hasActive = items.some((t) => t.id === activeTopic);
            return (
              <details className={`side-group${hasActive ? ' has-active' : ''}`} key={g.title} open={gi === 0 || hasActive}>
                <summary className="side-label">
                  {g.title} <span className="side-count">{items.length}</span>
                </summary>
                {items.map((t) => (
                  <Link
                    key={t.id}
                    href={`/topic/${t.id}`}
                    className={`side-item${t.id === activeTopic ? ' active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <TopicIcon id={t.id} side />
                    {t.name}
                  </Link>
                ))}
              </details>
            );
          })}
        </div>
        <div className="side-footer">
          <button className="side-btn" id="printBtn" type="button" title="Print / Export PDF (Ctrl+P)" onClick={() => window.print()}>
            Print / PDF
          </button>
          <Link className="side-btn disclaimer-link-btn" id="disclaimerLinkBtn" href="/disclaimer" title="View Educational Terms & Disclaimer">
            Clinical notice
          </Link>
          <a className="side-btn" href="mailto:apps@aamd.sa?subject=EM%20Pocket%20feedback" title="Send feedback or suggestions to apps@aamd.sa">
            Send feedback
          </a>
          <p className="side-note">Education only — never replaces clinical judgment or local protocols.</p>
        </div>
      </nav>
      <div
        className={`side-backdrop${sidebarOpen ? ' show' : ''}`}
        id="sideBackdrop"
        onClick={() => setSidebarOpen(false)}
      />
    </>
  );
}
