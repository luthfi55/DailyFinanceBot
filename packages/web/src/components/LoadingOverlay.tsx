"use client";

import { useGlobalLoading } from "./providers/GlobalLoadingProvider";

export function LoadingOverlay() {
  const { isLoading } = useGlobalLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Loading...
        </span>
      </div>
    </div>
  );
}
