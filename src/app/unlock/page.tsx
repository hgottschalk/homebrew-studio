'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Beer, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function UnlockBreweryPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || loading) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim(), action: 'unlock' }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Incorrect Brewery PIN.');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Unable to reach server. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center shadow-lg shadow-[#3B82F6]/25"
            aria-hidden="true"
          >
            <Beer className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Homebrew Recipe Studio
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Enter your Brewery PIN / Passcode to unlock your recipes,
              inventory, and brewer&apos;s logs on this device.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="brewery-pin-input"
              className="block text-xs font-semibold text-slate-200 mb-1.5"
            >
              Brewery PIN or Passcode
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="brewery-pin-input"
                type="password"
                autoFocus
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter BREW_STUDIO_PIN..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white tracking-widest"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            <span>{loading ? 'Unlocking Studio...' : 'Unlock Studio'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-300">
          <ShieldCheck
            className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>
            Once unlocked, this device stays signed in for 90 days via an
            encrypted HttpOnly cookie so you can launch directly from your
            phone&apos;s Home Screen on brew day.
          </span>
        </div>
      </div>
    </main>
  );
}
