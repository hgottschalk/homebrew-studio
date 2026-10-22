import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'brew_studio_auth';

async function computePinToken(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`homebrew-studio-v1:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
  const configuredPin = process.env.BREW_STUDIO_PIN?.trim();

  // Zero-config open-source default: if BREW_STUDIO_PIN is not set, allow all traffic
  if (!configuredPin) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // Always allow public assets, manifest, unlock screen, and the PIN verification API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/unlock') ||
    pathname.startsWith('/api/auth/pin') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/icon.svg' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const expectedToken = await computePinToken(configuredPin);
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (cookieToken === expectedToken) {
    return NextResponse.next();
  }

  // Return 401 JSON for protected API calls
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Unauthorized: Brewery PIN required' },
      { status: 401 }
    );
  }

  // Redirect unauthenticated browser navigation to /unlock
  const unlockUrl = req.nextUrl.clone();
  unlockUrl.pathname = '/unlock';
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
