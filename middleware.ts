import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// List of public paths that don't require authentication
const publicPaths = ["/", "/api/auth"];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const path = request.nextUrl.pathname;

  // Allow access to public paths
  if (publicPaths.some((publicPath) => path.startsWith(publicPath))) {
    // If user is authenticated and tries to access login page, redirect to dashboard
    if (path === "/" && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // For all other paths, check authentication
  if (!isAuth) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and auth routes
    "/",
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/services/:path*",
    "/pos/:path*",
    "/reports/:path*",
    "/customers/:path*",
    "/hours/:path*",
    "/consultation-form/:path*",
    "/welcome/:path*",
    "/test-data/:path*",
  ],
};
