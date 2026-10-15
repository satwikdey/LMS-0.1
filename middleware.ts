import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Let Next.js handle page routing and API dispatching
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
