import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'brew_studio_auth';
const NINETY_DAYS_SECONDS = 60 * 60 * 24 * 90;

async function computePinToken(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`homebrew-studio-v1:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
  const configuredPin = process.env.BREW_STUDIO_PIN?.trim();
  if (!configuredPin) {
    return NextResponse.json({
      pinRequired: false,
      unlocked: true,
    });
  }

  const expectedToken = await computePinToken(configuredPin);
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  return NextResponse.json({
    pinRequired: true,
    unlocked: cookieToken === expectedToken,
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

    const submittedPin = (body.pin || '').trim();
    if (submittedPin !== configuredPin) {
      return NextResponse.json(
        { error: 'Invalid Brewery PIN or Passcode. Please try again.' },
        { status: 401 }
      );
    }

    const token = await computePinToken(configuredPin);
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
