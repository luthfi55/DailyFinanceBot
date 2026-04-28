"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGlobalLoading } from "./providers/GlobalLoadingProvider";

export function RouteLoadingHandler() {
  const { startLoading, stopLoading } = useGlobalLoading();
  const pathname = usePathname();

  useEffect(() => {
    startLoading();
    const timer = setTimeout(() => {
      stopLoading();
    }, 300);
    return () => {
      clearTimeout(timer);
      stopLoading();
    };
  }, [pathname, startLoading, stopLoading]);

  return null;
}
