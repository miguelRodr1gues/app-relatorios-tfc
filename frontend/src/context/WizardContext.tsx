import React, { createContext, useContext, useMemo, useState } from "react";

type WizardContextValue = {
  isOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
};

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<WizardContextValue>(
    () => ({
      isOpen,
      openWizard: () => setIsOpen(true),
      closeWizard: () => setIsOpen(false),
    }),
    [isOpen]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}

