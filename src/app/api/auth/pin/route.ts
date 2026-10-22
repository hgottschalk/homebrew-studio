import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  NINETY_DAYS_SECONDS,
  createSignedSessionToken,
  verifySignedSessionToken,
  timingSafeEqual,
} from '@/lib/auth';

// In-memory rate limiting map (IP -> { count, lockedUntil })
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function GET(req: NextRequest) {
  const configuredPin = process.env.BREW_STUDIO_PIN?.trim();
  if (!configuredPin) {
    return NextResponse.json({
      pinRequired: false,
      unlocked: true,
    });
  }

  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isUnlocked = await verifySignedSessionToken(cookieToken, configuredPin);

  return NextResponse.json({
    pinRequired: true,
    unlocked: isUnlocked,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      pin?: string;
      action?: 'unlock' | 'logout';
    };

    if (body.action === 'logout') {
      const res = NextResponse.json({ ok: true, unlocked: false });
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    const configuredPin = process.env.BREW_STUDIO_PIN?.trim();
    if (!configuredPin) {
      return NextResponse.json({ ok: true, unlocked: true });
    }

    const ip = getClientIp(req);
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { attempts: 0, lockedUntil: 0 };

    // Check if IP is currently locked out
    if (record.lockedUntil > now) {
      const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return NextResponse.json(
        {
          error: `Too many failed attempts. Please wait ${waitSeconds}s before trying again.`,
        },
        { status: 429 }
      );
    }

    const submittedPin = (body.pin || '').trim();

    // Constant-time PIN check against timing attacks
    const encoder = new TextEncoder();
    const submittedBytes = encoder.encode(submittedPin);
    const configuredBytes = encoder.encode(configuredPin);

    const isMatch = timingSafeEqual(submittedBytes, configuredBytes);

    if (!isMatch) {
      record.attempts += 1;
      // Exponential backoff: after 5 failed attempts, lock for 30s; after 10, lock for 5m
      if (record.attempts >= 10) {
        record.lockedUntil = now + 5 * 60 * 1000; // 5 minutes
      } else if (record.attempts >= 5) {
        record.lockedUntil = now + 30 * 1000; // 30 seconds
      }
      rateLimitMap.set(ip, record);

      // Artificial small jitter to prevent rapid-fire brute forcing
      await new Promise((r) => setTimeout(r, Math.min(record.attempts * 150, 1000)));

      return NextResponse.json(
        {
          error:
            record.attempts >= 5
              ? `Invalid PIN. Too many failed attempts. Temporary lockout engaged.`
              : `Invalid Brewery PIN or Passcode. Please try again.`,
        },
        { status: 401 }
      );
    }

    // Success: reset rate limit attempts for this IP
    rateLimitMap.delete(ip);

    // Issue cryptographic HMAC-signed session token
    const token = await createSignedSessionToken(configuredPin);
    const res = NextResponse.json({ ok: true, unlocked: true });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: NINETY_DAYS_SECONDS,
    });
    return res;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Authentication request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
