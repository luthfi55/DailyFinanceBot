"use client";

import { useCallback } from "react";
import { useGlobalLoading } from "./GlobalLoadingProvider";

export function useAction<T extends (...args: any[]) => Promise<any>>(
  action: T
) {
  const { startLoading, stopLoading } = useGlobalLoading();

  const run = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      startLoading();
      try {
        const result = await action(...args);
        return result;
      } finally {
        stopLoading();
      }
    },
    [action, startLoading, stopLoading]
  );

  return run;
}
