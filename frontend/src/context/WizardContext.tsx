import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

type WizardContextValue = {
  isOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
  onReportCreated: (() => void) | null;
  setOnReportCreated: (callback: (() => void) | null) => void;
};

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onReportCreated, setOnReportCreated] = useState<(() => void) | null>(null);

  const closeWizard = useCallback(() => {
    setIsOpen(false);
    // Call the callback if it exists
    if (onReportCreated) {
      onReportCreated();
      setOnReportCreated(null);
    }
  }, [onReportCreated]);

  const value = useMemo<WizardContextValue>(
    () => ({
      isOpen,
      openWizard: () => setIsOpen(true),
      closeWizard,
      onReportCreated,
      setOnReportCreated,
    }),
    [isOpen, closeWizard, onReportCreated]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}

