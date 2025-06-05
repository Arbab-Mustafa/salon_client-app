"use client";

import type React from "react";

import { Toaster as HotToaster } from "react-hot-toast";

const Toaster = (props: React.ComponentProps<typeof HotToaster>) => (
  <HotToaster
    position="top-right"
    toastOptions={{
      className:
        "group toast bg-background text-foreground border border-gray-200 shadow-lg",
    }}
    {...props}
  />
);

export { Toaster };
