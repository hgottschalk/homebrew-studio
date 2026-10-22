import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { BrewerySnapshot } from '@/store/useBrewStore';

export type SyncBackendMode =
  | 'upstash-redis'
  | 'github-gist'
  | 'local-file'
  | 'browser-only';

const GIST_FILENAME = 'homebrew-recipe-studio-state.json';
const REDIS_KEY = 'homebrew_recipe_studio_v1';
const LOCAL_DATA_DIR = path.join(process.cwd(), '.data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'brewery-state.json');

function detectSyncMode(): SyncBackendMode {
  const redisUrl =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (redisUrl && redisToken) {
    return 'upstash-redis';
  }

  if (process.env.GITHUB_GIST_TOKEN?.trim()) {
    return 'github-gist';
  }

  // On serverless read-only environments (e.g. Vercel without env vars), fall back to browser-only
  if (process.env.VERCEL === '1') {
    return 'browser-only';
  }

  return 'local-file';
}

// --- 1. Upstash Redis / Vercel KV REST Adapter ($0 Free Tier) ---
async function readFromUpstash(): Promise<BrewerySnapshot | null> {
  const url = (
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    ''
  ).replace(/\/$/, '');
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

  const res = await fetch(`${url}/get/${REDIS_KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  if (!data.result) return null;
  return JSON.parse(data.result) as BrewerySnapshot;
}

async function writeToUpstash(snapshot: BrewerySnapshot): Promise<void> {
  const url = (
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    ''
  ).replace(/\/$/, '');
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

  await fetch(`${url}/set/${REDIS_KEY}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(JSON.stringify(snapshot)),
  });
}

// --- 2. Secret GitHub Gist Adapter ($0 Forever with GitHub Account) ---
async function findOrCreateGistId(token: string): Promise<string | null> {
  if (process.env.GITHUB_GIST_ID?.trim()) {
    return process.env.GITHUB_GIST_ID.trim();
  }

  const listRes = await fetch('https://api.github.com/gists?per_page=50', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (!listRes.ok) return null;
  const gists = (await listRes.json()) as Array<{
    id: string;
    files?: Record<string, unknown>;
  }>;

  const existing = gists.find((g) => g.files && GIST_FILENAME in g.files);
  return existing ? existing.id : null;
}

async function readFromGitHubGist(): Promise<BrewerySnapshot | null> {
  const token = process.env.GITHUB_GIST_TOKEN?.trim() || '';
  const gistId = await findOrCreateGistId(token);
  if (!gistId) return null;

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    files?: Record<string, { content?: string }>;
  };
  const raw = data.files?.[GIST_FILENAME]?.content;
  if (!raw) return null;
  return JSON.parse(raw) as BrewerySnapshot;
}

async function writeToGitHubGist(snapshot: BrewerySnapshot): Promise<void> {
  const token = process.env.GITHUB_GIST_TOKEN?.trim() || '';
  const gistId = await findOrCreateGistId(token);
  const content = JSON.stringify(snapshot, null, 2);

  if (gistId) {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        description: 'Homebrew Recipe Studio — Cloud Synced Brewery State',
        files: {
          [GIST_FILENAME]: { content },
        },
      }),
    });
  } else {
    await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        description: 'Homebrew Recipe Studio — Cloud Synced Brewery State',
        public: false,
        files: {
          [GIST_FILENAME]: { content },
        },
      }),
    });
  }
}

// --- 3. Local File Adapter (Home Wi-Fi Computer <-> Phone Sync) ---
async function readFromLocalFile(): Promise<BrewerySnapshot | null> {
  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
    return JSON.parse(raw) as BrewerySnapshot;
  } catch {
    return null;
  }
}

async function writeToLocalFile(snapshot: BrewerySnapshot): Promise<void> {
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.writeFile(
    LOCAL_DATA_FILE,
    JSON.stringify(snapshot, null, 2),
    'utf-8'
  );
}

export async function GET() {
  const mode = detectSyncMode();
  const pinConfigured = Boolean(process.env.BREW_STUDIO_PIN?.trim());

  try {
    let snapshot: BrewerySnapshot | null = null;
    if (mode === 'upstash-redis') {
      snapshot = await readFromUpstash();
    } else if (mode === 'github-gist') {
      snapshot = await readFromGitHubGist();
    } else if (mode === 'local-file') {
      snapshot = await readFromLocalFile();
    }

    return NextResponse.json({
      mode,
      pinConfigured,
      snapshot,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to read sync state';
    return NextResponse.json(
      { mode, pinConfigured, snapshot: null, error: message },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  const mode = detectSyncMode();
  try {
    const body = (await req.json()) as { snapshot?: BrewerySnapshot };
    if (!body.snapshot || !body.snapshot.recipe) {
      return NextResponse.json(
        { error: 'Invalid brewery snapshot payload' },
        { status: 400 }
      );
    }

    const snapshot: BrewerySnapshot = {
      ...body.snapshot,
      exportedAt: new Date().toISOString(),
    };

    if (mode === 'upstash-redis') {
      await writeToUpstash(snapshot);
    } else if (mode === 'github-gist') {
      await writeToGitHubGist(snapshot);
    } else if (mode === 'local-file') {
      await writeToLocalFile(snapshot);
    }

    return NextResponse.json({
      ok: true,
      mode,
      syncedAt: snapshot.exportedAt,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to write sync state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
