import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

interface UnsavedChangesContextValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  promptDiscardChanges: (onProceed: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

let globalIsDirty = false;
let globalSetDirty: ((dirty: boolean) => void) | null = null;

export function setGlobalDirty(dirty: boolean): void {
  globalIsDirty = dirty;
  globalSetDirty?.(dirty);
}

export function isGlobalDirty(): boolean {
  return globalIsDirty;
}

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);

  const setDirty = useCallback((dirty: boolean) => {
    globalIsDirty = dirty;
    setIsDirty(dirty);
  }, []);

  globalSetDirty = setDirty;

  // Web beforeunload protection against closing tab / window
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const value = useMemo(
    () => ({
      isDirty,
      setDirty,
      promptDiscardChanges: (onProceed: () => void) => {
        setDirty(false);
        onProceed();
      },
    }),
    [isDirty, setDirty],
  );

  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>;
}

export function useUnsavedChanges() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    return {
      isDirty: globalIsDirty,
      setDirty: setGlobalDirty,
      promptDiscardChanges: (onProceed: () => void) => {
        setGlobalDirty(false);
        onProceed();
      },
    };
  }
  return ctx;
}
