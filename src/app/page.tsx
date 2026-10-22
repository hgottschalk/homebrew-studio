'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useBrewStore, ActiveTab } from '@/store/useBrewStore';
import { calculateBrewMetrics } from '@/lib/calculations';
import { RecipeBuilderView } from '@/components/recipe/RecipeBuilderView';
import { InventoryView } from '@/components/inventory/InventoryView';
import { WaterChemistryView } from '@/components/water/WaterChemistryView';
import { BrewDayView } from '@/components/brewday/BrewDayView';
import { AiRecipeAssistant } from '@/components/ai/AiRecipeAssistant';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { CloudSyncControl } from '@/components/sync/CloudSyncModal';
import {
  SplashCreditsModal,
  useSessionSplash,
  GITHUB_AVATAR_URL,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
} from '@/components/ui/SplashCreditsModal';
import {
  Beer,
  FlaskConical,
  Package,
  Droplets,
  Timer,
  Sparkles,
  Keyboard,
} from 'lucide-react';

export default function HomePage() {
  const {
    recipe,
    batchLogs,
    activeTab,
    unitSystem,
    setActiveTab,
    setUnitSystem,
    saveCurrentRecipe,
  } = useBrewStore();

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const { showSplash, setShowSplash } = useSessionSplash();
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const desktopTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileTabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const metrics = useMemo(() => calculateBrewMetrics(recipe), [recipe]);

  const navItems: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    shortcut: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'recipe',
      label: 'Recipe Builder',
      shortLabel: 'Recipe',
      shortcut: 'Alt+1',
      icon: FlaskConical,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      shortLabel: 'Inventory',
      shortcut: 'Alt+2',
      icon: Package,
    },
    {
      id: 'water',
      label: 'Water & Mash',
      shortLabel: 'Water & Mash',
      shortcut: 'Alt+3',
      icon: Droplets,
    },
    {
      id: 'brewday',
      label: "Brewer's Log",
      shortLabel: "Brewer's Log",
      shortcut: 'Alt+4',
      icon: Timer,
      badge: batchLogs.length,
    },
    {
      id: 'ai',
      label: 'AI Brewmaster',
      shortLabel: 'AI Assist',
      shortcut: 'Alt+5',
      icon: Sparkles,
    },
  ];

  // Global keyboard shortcuts (Alt+1..5, Cmd/Ctrl+S, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentRecipe();
        setLiveAnnouncement(`Saved recipe ${recipe.name} to local library.`);
        return;
      }

      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        const index = parseInt(e.key, 10) - 1;
        if (index >= 0 && index < navItems.length) {
          e.preventDefault();
          const chosen = navItems[index];
          setActiveTab(chosen.id);
          setLiveAnnouncement(`Switched to ${chosen.label}`);
          return;
        }
      }

      if (!isEditable && e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number,
    refsArray: React.MutableRefObject<(HTMLButtonElement | null)[]>
  ) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = (idx + 1) % navItems.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = (idx - 1 + navItems.length) % navItems.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = navItems.length - 1;
    }

    if (nextIdx !== null) {
      const nextItem = navItems[nextIdx];
      setActiveTab(nextItem.id);
      refsArray.current[nextIdx]?.focus();
    }
  };

  const handleUnitKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown'
    ) {
      e.preventDefault();
      const nextUnit = unitSystem === 'imperial' ? 'metric' : 'imperial';
      setUnitSystem(nextUnit);
      setLiveAnnouncement(
        `Switched measurement units to ${
          nextUnit === 'imperial'
            ? 'US Imperial (lbs, oz, gal, °F)'
            : 'Metric (kg, g, L, °C)'
        }`
      );
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-slate-950 pb-20 md:pb-0">
      {/* Centralized Screen Reader Polite Live Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      >
        {liveAnnouncement}
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/90 border-b border-slate-800 no-print">
        {/* Skip to Main Content Link for Keyboard Users */}
        <a href="#main-content" className="skip-link visually-hidden">
          Skip to main workspace
        </a>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap xl:flex-nowrap items-center justify-between gap-2.5">
          {/* Brand Logo & Active Recipe Summary Pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center shadow-lg shadow-[#3B82F6]/20 shrink-0"
              aria-hidden="true"
            >
              <Beer className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                  Homebrew Recipe Studio
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 whitespace-nowrap">
                  <span className="hidden 2xl:inline">
                    OG {metrics.og.toFixed(3)} •{' '}
                  </span>
                  {metrics.abv.toFixed(1)}% ABV • {metrics.ibu.toFixed(0)} IBU •{' '}
                  {metrics.srm} SRM
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-300 truncate">
                Grain, Honey, Sugar, Hop &amp; Yeast Formulation Workbench
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Segmented Pill Navigation (Row 2 on md..lg, Center Inline on xl+) */}
          <nav
            aria-label="Workspace Modules"
            className="hidden md:block w-full xl:w-auto order-3 xl:order-2 pt-1.5 xl:pt-0 border-t border-slate-800/70 xl:border-t-0"
          >
            <div
              role="tablist"
              aria-label="Brewing Workspace Sections"
              className="grid grid-cols-5 xl:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl"
            >
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      desktopTabRefs.current[idx] = el;
                    }}
                    id={`tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${item.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTab(item.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, idx, desktopTabRefs)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#10B981]/20 text-[#10B981]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Unified Unit System Segmented Radiogroup + Keyboard Help Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 xl:order-3">
            <div
              role="radiogroup"
              aria-label="Measurement Unit System"
              className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1"
            >
              <button
                type="button"
                role="radio"
                aria-checked={unitSystem === 'imperial'}
                tabIndex={unitSystem === 'imperial' ? 0 : -1}
                onClick={() => setUnitSystem('imperial')}
                onKeyDown={handleUnitKeyDown}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  unitSystem === 'imperial'
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span className="sm:hidden">US</span>
                <span className="hidden sm:inline">US (lbs/gal/°F)</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={unitSystem === 'metric'}
                tabIndex={unitSystem === 'metric' ? 0 : -1}
                onClick={() => setUnitSystem('metric')}
                onKeyDown={handleUnitKeyDown}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  unitSystem === 'metric'
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span className="sm:hidden">Metric</span>
                <span className="hidden sm:inline">Metric (kg/L/°C)</span>
              </button>
            </div>

            <CloudSyncControl />

            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              aria-label="Open keyboard shortcuts and accessibility guide"
              title="Keyboard Shortcuts (?)"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <Keyboard className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setShowSplash(true)}
              aria-label="About Homebrew Recipe Studio & Creator Credits (@hgottschalk)"
              title="About & Creator Credits — Harold Gottschalk (@hgottschalk)"
              className="p-0.5 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#10B981] hover:scale-105 transition-transform cursor-pointer shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GITHUB_AVATAR_URL}
                alt="Harold Gottschalk (@hgottschalk)"
                className="w-7 h-7 rounded-full object-cover bg-slate-950"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 focus:outline-none"
      >
        <section
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'recipe' && <RecipeBuilderView metrics={metrics} />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'water' && <WaterChemistryView metrics={metrics} />}
          {activeTab === 'brewday' && <BrewDayView metrics={metrics} />}
          {activeTab === 'ai' && <AiRecipeAssistant />}
        </section>
      </main>

      {/* Adaptive Mobile Bottom Tab Bar (< md viewports) */}
      <nav
        aria-label="Mobile Workspace Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 no-print"
      >
        <div
          role="tablist"
          aria-label="Mobile Workspace Sections"
          className="grid grid-cols-5 gap-1"
        >
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  mobileTabRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(item.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx, mobileTabRefs)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" aria-hidden="true" />
                <span className="truncate max-w-full">{item.shortLabel}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#10B981] text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer with Creator Credits & Open Source Links */}
      <footer className="border-t border-slate-900 py-5 px-4 text-center text-xs text-slate-300 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowSplash(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GITHUB_AVATAR_URL}
                alt=""
                aria-hidden="true"
                className="w-4 h-4 rounded-full object-cover"
              />
              <span>
                Created by{' '}
                <strong className="text-white">
                  Harold Gottschalk (@hgottschalk)
                </strong>{' '}
                • <span className="text-[#10B981] font-semibold">SoftBrew</span>
              </span>
            </button>
            <span className="hidden sm:inline text-slate-600">•</span>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-[#3B82F6] underline decoration-slate-700 underline-offset-4"
            >
              Open Source on GitHub (homebrew-studio)
            </a>
          </div>

          <div>
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-slate-200">
              ?
            </kbd>{' '}
            for Keyboard Shortcuts •{' '}
            <button
              type="button"
              onClick={() => setShowSplash(true)}
              className="text-[#3B82F6] hover:underline cursor-pointer font-medium"
            >
              About &amp; Credits
            </button>
          </div>
        </div>
      </footer>

      {/* Once-per-Session Splash Screen & Creator Credits Modal */}
      <SplashCreditsModal
        open={showSplash}
        onClose={() => setShowSplash(false)}
      />

      {/* Keyboard Shortcuts & Accessibility Modal */}
      <ModalDialog
        open={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        title="Keyboard Navigation & Shortcuts"
        description="Full ADA / WCAG 2.1 AA keyboard operation reference for Homebrew Recipe Studio."
        icon={Keyboard}
        maxWidthClass="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <h3 className="font-bold text-white uppercase tracking-wider">
              Global Workspace Shortcuts
            </h3>
            <dl className="divide-y divide-slate-800/80">
              {[
                { keys: 'Alt + 1 .. 5', desc: 'Switch between the 5 workspace modules' },
                { keys: 'Ctrl / Cmd + S', desc: 'Save current recipe to local library' },
                { keys: 'Ctrl / Cmd + P', desc: "Print active Recipe Sheet or Brewer's Log" },
                { keys: '?', desc: 'Open or close this Keyboard Shortcuts dialog' },
              ].map((s) => (
                <div
                  key={s.keys}
                  className="py-2 flex items-center justify-between gap-4"
                >
                  <dt className="text-slate-300">{s.desc}</dt>
                  <dd>
                    <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white">
                      {s.keys}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <h3 className="font-bold text-white uppercase tracking-wider">
              Widget &amp; Menu Controls
            </h3>
            <dl className="divide-y divide-slate-800/80">
              {[
                {
                  keys: 'Tab / Shift + Tab',
                  desc: 'Move focus between interactive regions & controls',
                },
                {
                  keys: '← / → Arrow Keys',
                  desc: 'Cycle active Tab, Unit System, or Category Filter pill',
                },
                {
                  keys: '↓ / ↑ Arrow Keys',
                  desc: 'Navigate items inside Recipe File or Share & Export menus',
                },
                {
                  keys: 'Enter / Space',
                  desc: 'Activate focused button, menu item, or toggle',
                },
                {
                  keys: 'Escape',
                  desc: 'Dismiss open dropdown menu or modal dialog and restore focus',
                },
              ].map((s) => (
                <div
                  key={s.keys}
                  className="py-2 flex items-center justify-between gap-4"
                >
                  <dt className="text-slate-300">{s.desc}</dt>
                  <dd>
                    <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-white">
                      {s.keys}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}
