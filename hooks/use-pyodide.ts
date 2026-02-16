"use client";

/**
 * React hook for managing Pyodide state with detailed logging
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { PyodideInterface } from "@/lib/pyodide/types";
import { loadPyodide, isPyodideSupported, resetPyodide } from "@/lib/pyodide/loader";

export interface UsePyodideOptions {
  autoLoad?: boolean;
  onReady?: (pyodide: PyodideInterface) => void;
  onError?: (error: Error) => void;
}

export interface PyodideState {
  pyodide: PyodideInterface | null;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  isSupported: boolean;
  load: () => Promise<PyodideInterface>;
  reset: () => void;
}

export function usePyodide(options: UsePyodideOptions = {}): PyodideState {
  const { autoLoad = false, onReady, onError } = options;

  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSupported = isPyodideSupported();
  const isReady = Boolean(pyodide);
  const isLoadingRef = useRef(false);

  const load = useCallback(async () => {
    console.log('[usePyodide] load() called', { isSupported, pyodide: !!pyodide, isLoading: isLoadingRef.current });

    if (!isSupported) {
      const err = new Error("Pyodide is not supported in this browser");
      console.error('[usePyodide] Not supported', err);
      setError(err);
      onError?.(err);
      throw err;
    }

    if (pyodide) {
      console.log('[usePyodide] Already have pyodide instance');
      return pyodide;
    }

    if (isLoadingRef.current) {
      console.log('[usePyodide] Already loading, waiting...');
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 500));
      if (pyodide) return pyodide;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    console.log('[usePyodide] Starting load...');

    try {
      const instance = await loadPyodide();
      console.log('[usePyodide] Load successful, setting state');
      setPyodide(instance);
      setError(null);
      onReady?.(instance);
      return instance;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[usePyodide] Load failed:', error);
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      console.log('[usePyodide] Load complete', { pyodide: !!pyodide, error });
    }
  }, [isSupported, pyodide, onReady, onError]);

  const reset = useCallback(() => {
    console.log('[usePyodide] Reset called');
    setPyodide(null);
    setIsLoading(false);
    setError(null);
    isLoadingRef.current = false;
    resetPyodide();
  }, []);

  // Auto-load if enabled
  useEffect(() => {
    console.log('[usePyodide] useEffect', { autoLoad, isSupported, pyodide: !!pyodide, isLoading: isLoadingRef.current });

    if (autoLoad && isSupported && !pyodide && !isLoadingRef.current) {
      console.log('[usePyodide] Auto-loading...');
      load().catch((err) => {
        console.error('[usePyodide] Auto-load failed:', err);
      });
    }
  }, [autoLoad, isSupported, pyodide, load]);

  return {
    pyodide,
    isLoading,
    isReady,
    error,
    isSupported,
    load,
    reset,
  };
}
