/**
 * Security and authentication utility for Homebrew Recipe Studio.
 * Uses Web Crypto API so it is 100% compatible with both Edge runtime (middleware)
 * and Node.js runtime (API routes).
 */

export const AUTH_COOKIE_NAME = 'brew_studio_auth';
export const NINETY_DAYS_SECONDS = 60 * 60 * 24 * 90;

interface AuthPayload {
  v: 1;
  exp: number; // Expiration epoch in seconds
  pinHash: string; // Truncated hash of PIN to invalidate sessions if PIN changes
}

/**
 * Returns the signing secret.
 * Falls back to a deterministic machine-derived secret if BREW_STUDIO_SECRET is not set,
 * but strongly prefers an explicit secret.
 */
function getSigningSecret(): string {
  return (
    process.env.BREW_STUDIO_SECRET?.trim() ||
    `fallback-secret:${process.env.BREW_STUDIO_PIN || 'default'}`
  );
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array | null {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Computes a constant-time comparison of two Uint8Arrays to prevent timing attacks.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Computes SHA-256 hash of a string, returned as a hex string.
 */
export async function computeSha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Signs data using HMAC-SHA256 with the server's secret.
 */
async function hmacSha256(data: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return new Uint8Array(signature);
}

/**
 * Creates a signed, tamper-proof session token.
 */
export async function createSignedSessionToken(pin: string): Promise<string> {
  const secret = getSigningSecret();
  const pinHash = (await computeSha256(pin)).slice(0, 16);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + NINETY_DAYS_SECONDS;

  const payload: AuthPayload = {
    v: 1,
    exp,
    pinHash,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadStr));

  const signature = await hmacSha256(payloadB64, secret);
  const signatureB64 = base64UrlEncode(signature);

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies a signed session token. Checks:
 * 1. Cryptographic HMAC signature against BREW_STUDIO_SECRET
 * 2. Token expiration
 * 3. Token was created with the CURRENT active PIN (invalidates old sessions if PIN is changed)
 */
export async function verifySignedSessionToken(
  token: string | undefined | null,
  configuredPin: string
): Promise<boolean> {
  if (!token || !configuredPin) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signatureB64] = parts;
  const secret = getSigningSecret();

  // 1. Recompute HMAC signature
  const expectedSigBytes = await hmacSha256(payloadB64, secret);
  const actualSigBytes = base64UrlDecode(signatureB64);
  if (!actualSigBytes) return false;

  // Constant-time comparison against timing attacks
  if (!timingSafeEqual(expectedSigBytes, actualSigBytes)) {
    return false;
  }

  // 2. Decode payload and check expiration
  const payloadBytes = base64UrlDecode(payloadB64);
  if (!payloadBytes) return false;

  try {
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadStr) as AuthPayload;

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return false; // Expired
    }

    // 3. Invalidate if PIN was changed on the server
    const currentPinHash = (await computeSha256(configuredPin)).slice(0, 16);
    const encoder = new TextEncoder();
    if (
      !timingSafeEqual(
        encoder.encode(payload.pinHash || ''),
        encoder.encode(currentPinHash)
      )
    ) {
      return false; // Stale session from a previous PIN
    }

    return true;
  } catch {
    return false;
  }
}
