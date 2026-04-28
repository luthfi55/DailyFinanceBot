"use client";

import { SessionProvider } from "next-auth/react";
import { GlobalLoadingProvider } from "@/components/providers/GlobalLoadingProvider";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { RouteLoadingHandler } from "@/components/RouteLoadingHandler";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GlobalLoadingProvider>
        <RouteLoadingHandler />
        <LoadingOverlay />
        {children}
      </GlobalLoadingProvider>
    </SessionProvider>
  );
}
