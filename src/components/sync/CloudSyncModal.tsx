'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useBrewStore, BrewerySnapshot } from '@/store/useBrewStore';
import { ModalDialog } from '@/components/ui/ModalDialog';
import type { SyncBackendMode } from '@/app/api/brewery-sync/route';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  Smartphone,
  Lock,
  LogOut,
  HardDrive,
} from 'lucide-react';

interface SyncGetResponse {
  mode: SyncBackendMode;
  pinConfigured: boolean;
  snapshot: BrewerySnapshot | null;
  error?: string;
}

const MODE_LABELS: Record<
  SyncBackendMode,
  { title: string; badge: string; description: string }
> = {
  'upstash-redis': {
    title: 'Upstash Redis / Vercel KV ($0 Free Cloud)',
    badge: 'Cloud KV',
    description:
      'Automatically syncing recipes, inventory, and brew logs across your phone and computer via Upstash Redis REST API.',
  },
  'github-gist': {
    title: 'GitHub Secret Gist ($0 Free Cloud)',
    badge: 'GitHub Gist',
    description:
      'Automatically syncing your entire brewery studio to a private GitHub Gist on your GitHub account.',
  },
  'local-file': {
    title: 'Home Wi-Fi Server Sync (.data/brewery-state.json)',
    badge: 'Wi-Fi Sync',
    description:
      'Automatically syncing between this computer and any phone/tablet on your local Wi-Fi network.',
  },
  'browser-only': {
    title: 'Browser LocalStorage + JSON Backup',
    badge: 'Local',
    description:
      'Stored in this device browser. Use 1-Click Full Backup below or configure GITHUB_GIST_TOKEN / UPSTASH_REDIS_REST_URL for automatic cloud sync.',
  },
};

export function CloudSyncControl() {
  const {
    recipe,
    savedRecipes,
    inventory,
    batchLogs,
    customFermentables,
    customHops,
    customYeasts,
    unitSystem,
    getBrewerySnapshot,
    hydrateBrewerySnapshot,
  } = useBrewStore();

  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const hasHydratedFromServerRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const flashMessage = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const syncQuery = useQuery<SyncGetResponse>({
    queryKey: ['brewery-sync-state'],
    queryFn: async () => {
      const res = await fetch('/api/brewery-sync', { cache: 'no-store' });
      if (!res.ok) throw new Error('Sync check failed');
      return (await res.json()) as SyncGetResponse;
    },
    refetchOnWindowFocus: true,
  });

  const pushMutation = useMutation({
    mutationFn: async (snapshot: BrewerySnapshot) => {
      const res = await fetch('/api/brewery-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot }),
      });
      if (!res.ok) throw new Error('Failed to sync');
      return (await res.json()) as {
        ok: boolean;
        mode: SyncBackendMode;
        syncedAt: string;
      };
    },
    onSuccess: (data) => {
      setLastSyncedAt(data.syncedAt);
    },
  });

  // Initial pull or seed when app loads
  useEffect(() => {
    if (!syncQuery.data || hasHydratedFromServerRef.current) return;
    hasHydratedFromServerRef.current = true;

    const { mode, snapshot: remoteSnapshot } = syncQuery.data;
    if (mode === 'browser-only') return;

    if (remoteSnapshot && remoteSnapshot.recipe) {
      const remoteTime = new Date(
        remoteSnapshot.recipe.updatedAt || remoteSnapshot.exportedAt || 0
      ).getTime();
      const localTime = new Date(recipe.updatedAt || 0).getTime();

      if (remoteTime >= localTime) {
        hydrateBrewerySnapshot(remoteSnapshot);
        setLastSyncedAt(remoteSnapshot.exportedAt);
      } else {
        pushMutation.mutate(getBrewerySnapshot());
      }
    } else {
      // Seed the remote/local-file store with current client state on first run
      pushMutation.mutate(getBrewerySnapshot());
    }
  }, [
    syncQuery.data,
    recipe.updatedAt,
    hydrateBrewerySnapshot,
    getBrewerySnapshot,
    pushMutation,
  ]);

  // Debounced auto-push whenever brewery state changes
  useEffect(() => {
    if (!hasHydratedFromServerRef.current) return;
    const mode = syncQuery.data?.mode;
    if (!mode || mode === 'browser-only') return;

    const timer = setTimeout(() => {
      pushMutation.mutate(getBrewerySnapshot());
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    recipe,
    savedRecipes,
    inventory,
    batchLogs,
    customFermentables,
    customHops,
    customYeasts,
    unitSystem,
  ]);

  const handleExportFullBackup = () => {
    const snapshot = getBrewerySnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateSlug = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `homebrew-studio-full-backup-${dateSlug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashMessage('Downloaded full brewery backup (.json)');
  };

  const handleImportFullBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(
          String(reader.result)
        ) as Partial<BrewerySnapshot>;
        if (!parsed.recipe) {
          flashMessage('Invalid backup file: missing recipe data.');
          return;
        }
        hydrateBrewerySnapshot(parsed);
        if (syncQuery.data?.mode && syncQuery.data.mode !== 'browser-only') {
          pushMutation.mutate(getBrewerySnapshot());
        }
        flashMessage('Restored full brewery backup (recipes, inventory & logs)!');
      } catch {
        flashMessage('Could not parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualPull = async () => {
    const refreshed = await syncQuery.refetch();
    if (refreshed.data?.snapshot) {
      hydrateBrewerySnapshot(refreshed.data.snapshot);
      setLastSyncedAt(refreshed.data.snapshot.exportedAt);
      flashMessage('Pulled latest state from sync storage!');
    } else {
      flashMessage('No remote snapshot found yet.');
    }
  };

  const handleManualPush = () => {
    pushMutation.mutate(getBrewerySnapshot(), {
      onSuccess: () => {
        flashMessage('Pushed current brewery state to sync storage!');
      },
    });
  };

  const handleLockSession = async () => {
    await fetch('/api/auth/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    window.location.href = '/unlock';
  };

  const activeMode: SyncBackendMode = syncQuery.data?.mode || 'local-file';
  const modeMeta = MODE_LABELS[activeMode];
  const isSyncing = pushMutation.isPending || syncQuery.isFetching;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Sync and Mobile Access (${modeMeta.badge})`}
        title={`Sync & Mobile Setup (${modeMeta.title})`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-colors cursor-pointer"
      >
        {isSyncing ? (
          <RefreshCw
            className="w-3.5 h-3.5 text-[#3B82F6] animate-spin"
            aria-hidden="true"
          />
        ) : activeMode === 'browser-only' ? (
          <HardDrive
            className="w-3.5 h-3.5 text-slate-300"
            aria-hidden="true"
          />
        ) : (
          <Cloud className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{modeMeta.badge}</span>
      </button>

      <ModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Cloud Sync, Phone App & Full Brewery Backup"
        description="Sync your recipes, inventory, and brewer's logs across your computer and phone for $0."
        icon={Cloud}
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-5 text-xs">
          {statusMessage && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 bg-[#10B981]/15 border border-[#10B981]/40 text-emerald-300 px-3.5 py-2.5 rounded-xl font-medium"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Active Storage Provider Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-sm font-bold text-white">
                  {modeMeta.title}
                </span>
              </div>
              {lastSyncedAt && (
                <span className="text-[11px] text-slate-300" suppressHydrationWarning>
                  Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed">
              {modeMeta.description}
            </p>

            {activeMode !== 'browser-only' && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualPush}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Save to Sync Now</span>
                </button>
                <button
                  type="button"
                  onClick={handleManualPull}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pull Latest from Sync</span>
                </button>
              </div>
            )}
          </div>

          {/* 1-Click Full Brewery Studio JSON Backup / Restore */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Full Brewery Backup &amp; Restore (.json)
              </h3>
              <p className="text-slate-300 mt-0.5">
                Export or restore your entire brewery in one file:{' '}
                <strong className="text-white">
                  {savedRecipes.length} saved recipe(s)
                </strong>
                ,{' '}
                <strong className="text-white">
                  {inventory.length} inventory item(s)
                </strong>
                , and{' '}
                <strong className="text-white">
                  {batchLogs.length} brewer&apos;s log(s)
                </strong>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportFullBackup}
                className="inline-flex items-center gap-1.5 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Download Full Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Restore Backup File (.json)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFullBackup}
                className="hidden"
              />
            </div>
          </div>

          {/* Install on Phone (PWA) & $0 Cloud Deployment Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <Smartphone
                  className="w-4 h-4 text-[#3B82F6]"
                  aria-hidden="true"
                />
                <span>Use on Your Phone (PWA)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>
                  <strong className="text-white">Home Wi-Fi:</strong> Open your
                  computer&apos;s local IP on port <code className="text-slate-100">3456</code>{' '}
                  from your phone.
                </li>
                <li>
                  <strong className="text-white">iOS Safari:</strong> Tap{' '}
                  <em>Share → Add to Home Screen</em> for a full-screen app icon.
                </li>
                <li>
                  <strong className="text-white">Android Chrome:</strong> Tap{' '}
                  <em>Menu → Install App</em>.
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <Lock className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                <span>$0 Cloud Sync &amp; PIN Lock</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                When deploying to Vercel (free tier), set optional environment
                variables in <code className="text-slate-100">.env.local</code>{' '}
                or Vercel Settings:
              </p>
              <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                <li>• BREW_STUDIO_PIN=your-pin</li>
                <li>• GITHUB_GIST_TOKEN=ghp_...</li>
                <li>• UPSTASH_REDIS_REST_URL=...</li>
              </ul>
              {syncQuery.data?.pinConfigured && (
                <button
                  type="button"
                  onClick={handleLockSession}
                  className="mt-2 inline-flex items-center gap-1.5 text-rose-300 hover:text-rose-200 font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Lock Studio on This Device</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </ModalDialog>
    </>
  );
}
