"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

// Define route access by role
const ROUTE_ACCESS: Record<string, string[]> = {
  "/dashboard": ["owner"],
  "/users": ["owner"],
  "/services": ["owner"],
  "/pos": ["owner", "therapist", "manager"],
  "/reports": ["owner", "therapist", "manager"],
  "/hours": ["owner"],
  "/test-data": ["owner"],
  "/customers": ["owner", "therapist", "manager"],
  "/consultation-form": ["owner", "therapist", "manager"],
  "/welcome": ["owner", "therapist", "manager"],
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      // Store the current path to redirect back after login
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/?callbackUrl=${callbackUrl}`);
      return;
    }

    if (status === "authenticated" && session?.user) {
      const userRole = (session.user as any).role;

      // Check if the current route has role restrictions
      const routePath = pathname.split("/")[1]; // Get the first part of the path
      const routeKey = `/${routePath}`;
      const routeRoles = ROUTE_ACCESS[routeKey];

      // If route has restrictions and user's role is not allowed
      if (routeRoles && !routeRoles.includes(userRole)) {
        // Redirect to an appropriate page based on role
        router.push(userRole === "owner" ? "/dashboard" : "/pos");
      }

      // If specific roles are required for this component
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        router.push(userRole === "owner" ? "/dashboard" : "/pos");
      }
    }
  }, [status, session, router, pathname, allowedRoles]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-pink-700 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your access.
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children
  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  // If allowedRoles is specified, check if user has permission
  if (allowedRoles && !allowedRoles.includes((session.user as any).role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-pink-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to view this page.
          </p>
          <p className="text-gray-600 mt-2">
            Current role: {(session.user as any).role}
          </p>
          <p className="text-gray-600">
            Allowed roles: {allowedRoles.join(", ")}
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}
