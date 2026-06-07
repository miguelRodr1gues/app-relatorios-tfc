import React, { useCallback, useMemo, useState } from "react";
import { WizardContext, WizardContextValue } from "./WizardContextCore";

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onReportCreated, setOnReportCreated] = useState<(() => void) | null>(null);

  const closeWizard = useCallback(() => {
    setIsOpen(false);
    if (onReportCreated) {
      onReportCreated();
      setOnReportCreated(null);
    }
  }, [onReportCreated]);

  const openWizard = useCallback(() => setIsOpen(true), []);

  const value = useMemo<WizardContextValue>(
    () => ({
      isOpen,
      openWizard,
      closeWizard,
      onReportCreated,
      setOnReportCreated,
    }),
    [isOpen, openWizard, closeWizard, onReportCreated]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
