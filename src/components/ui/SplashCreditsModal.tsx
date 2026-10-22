'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Beer,
  FlaskConical,
  Droplets,
  Timer,
  Sparkles,
  ExternalLink,
  Heart,
  Code2,
  ArrowRight,
  X,
} from 'lucide-react';

const SESSION_SPLASH_KEY = 'homebrew_studio_splash_seen_v1';
export const GITHUB_USERNAME = 'hgottschalk';
export const GITHUB_PROFILE_URL = 'https://github.com/hgottschalk';
export const GITHUB_REPO_URL = 'https://github.com/hgottschalk/homebrew-studio';
export const GITHUB_AVATAR_URL = 'https://github.com/hgottschalk.png';

interface SplashCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export function useSessionSplash() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    try {
      const alreadySeen = sessionStorage.getItem(SESSION_SPLASH_KEY);
      if (!alreadySeen) {
        sessionStorage.setItem(SESSION_SPLASH_KEY, '1');
        setShowSplash(true);
      }
    } catch {
      // Ignore storage access errors in restricted contexts
    }
  }, []);

  return {
    showSplash,
    setShowSplash,
  };
}

export function SplashCreditsModal({ open, onClose }: SplashCreditsModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const enterBtnRef = useRef<HTMLButtonElement | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      enterBtnRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="splash-studio-title"
      aria-describedby="splash-studio-subtitle"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="app-modal w-full max-w-2xl bg-slate-900 text-slate-100 border border-slate-700/90 rounded-3xl p-0 shadow-2xl overflow-hidden"
    >
      {/* Top Gradient Banner */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 px-6 pt-7 pb-6 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#3B82F6]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-[#10B981]/15 blur-3xl"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close splash screen"
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="relative flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Creator GitHub Avatar in Dual-Tone Gradient Ring */}
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Harold Gottschalk (@hgottschalk) on GitHub"
            className="group relative shrink-0 rounded-full p-1 bg-gradient-to-tr from-[#3B82F6] via-cyan-400 to-[#10B981] shadow-xl shadow-[#3B82F6]/25 transition-transform hover:scale-105"
          >
            {!avatarError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={GITHUB_AVATAR_URL}
                alt="Harold Gottschalk (@hgottschalk) GitHub Avatar"
                onError={() => setAvatarError(true)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover bg-slate-950 border-2 border-slate-950"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950 flex items-center justify-center text-2xl font-bold text-white border-2 border-slate-950">
                HG
              </div>
            )}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center border-2 border-slate-950 shadow-md"
            >
              <Beer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </span>
          </a>

          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[11px] font-semibold">
              <span>Open-Source Brewing Workbench • v1.0</span>
            </div>

            <h2
              id="splash-studio-title"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
            >
              Homebrew Recipe Studio
            </h2>

            <p id="splash-studio-subtitle" className="text-xs sm:text-sm text-slate-300">
              Created by{' '}
              <a
                href={GITHUB_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-[#3B82F6] underline decoration-slate-600 underline-offset-4"
              >
                Harold Gottschalk (@hgottschalk)
              </a>{' '}
              • <span className="text-[#10B981] font-semibold">SoftBrew</span>
            </p>
          </div>
        </div>
      </div>

      {/* Studio Capabilities & Open-Source Credits Body */}
      <div className="p-6 space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <div
              className="p-2 rounded-lg bg-[#3B82F6]/15 text-[#3B82F6] shrink-0"
              aria-hidden="true"
            >
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">
                Grain, Honey &amp; Sugar Formulator
              </div>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Live OG, FG, ABV, IBU &amp; SRM with differential fermentability
                for mashed malts, floral honeys, candi syrups, and lactose.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <div
              className="p-2 rounded-lg bg-[#10B981]/15 text-[#10B981] shrink-0"
              aria-hidden="true"
            >
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">
                Water Chemistry &amp; Mash pH
              </div>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Auto-match target water profiles with Gypsum, CaCl₂, Epsom,
                Baking Soda, and Lactic Acid with live SO₄²⁻:Cl⁻ balance.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <div
              className="p-2 rounded-lg bg-amber-500/15 text-amber-300 shrink-0"
              aria-hidden="true"
            >
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">
                Brewer&apos;s Log &amp; Brew-Day Timers
              </div>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Record planned vs. actual ingredients, co-brewers, mash/boil
                countdowns with phone wake-lock, and gravity readings.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <div
              className="p-2 rounded-lg bg-purple-500/15 text-purple-300 shrink-0"
              aria-hidden="true"
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">
                $0 Cloud / Wi-Fi Sync &amp; AI Assist
              </div>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Sync across your Mac and Phone via Home Wi-Fi, Private GitHub
                Gist, or Upstash KV with optional PIN security.
              </p>
            </div>
          </div>
        </div>

        {/* Open Source & Community Links Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Heart
              className="w-4 h-4 text-rose-400 shrink-0"
              aria-hidden="true"
            />
            <span className="text-slate-300">
              Free &amp; open-source under the{' '}
              <strong className="text-white">MIT License</strong>. Contributions,
              hop/yeast additions, and PRs are welcome!
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold transition-colors"
            >
              <span>@hgottschalk</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[#10B981] border border-slate-700 font-semibold transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>GitHub Repo</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Footer Enter Studio Action */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-slate-400">
            Tip: Click the creator badge in the header or footer anytime to view
            credits.
          </span>

          <button
            ref={enterBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-[#3B82F6]/25 transition-colors cursor-pointer shrink-0"
          >
            <span>Enter Brewhouse Studio</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </dialog>
  );
}
