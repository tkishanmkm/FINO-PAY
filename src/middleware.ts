import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If the user requests the root, rewrite it to the /login-1 page.
  if (request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/login-1', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
