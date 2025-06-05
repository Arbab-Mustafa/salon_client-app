"use client";

import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/dashboard-header";
import DashboardStats from "@/components/dashboard-stats";
import ProtectedRoute from "@/components/protected-route";

// export const metadata: Metadata = {
//   title: "Dashboard | Gem 'n' Eyes EPOS",
//   description: "Therapist dashboard for Gem 'n' Eyes beauty salon",
// };

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-300">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-pink-600 mb-2">Loading Dashboard...</h2>
          <p className="text-gray-500">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  // If not authenticated, ProtectedRoute component will handle the redirect
  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="min-h-screen bg-pink-200">
        <DashboardHeader />
        <main className="container mx-auto p-4 pt-24">
          <DashboardStats />
        </main>
      </div>
    </ProtectedRoute>
  );
}
