import { createContext } from "react";

export type WizardContextValue = {
  isOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
  onReportCreated: (() => void) | null;
  setOnReportCreated: (callback: (() => void) | null) => void;
};

export const WizardContext = createContext<WizardContextValue | undefined>(undefined);
