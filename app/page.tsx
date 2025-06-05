export const dynamic = "force-dynamic";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-pink-100">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-pink-700 mb-2">
              Loading...
            </h2>
            <p className="text-gray-600">
              Please wait while we load the login page.
            </p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
