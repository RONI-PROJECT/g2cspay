import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  if (/^\/api(\/api)+($|\/)/.test(url.pathname)) {
    url.pathname = url.pathname.replace(/^\/api(\/api)+/, '/api');
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
