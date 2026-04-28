"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

interface GlobalLoadingContextValue {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export function GlobalLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const countRef = useRef(0);

  const startLoading = useCallback(() => {
    countRef.current += 1;
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    if (countRef.current === 0) {
      setIsLoading(false);
    }
  }, []);

  return (
    <GlobalLoadingContext.Provider
      value={{ isLoading, startLoading, stopLoading }}
    >
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  return useContext(GlobalLoadingContext);
}
