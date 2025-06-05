"use client";

import { AuthProvider as CustomAuthProvider } from "@/context/auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <CustomAuthProvider>{children}</CustomAuthProvider>;
}
