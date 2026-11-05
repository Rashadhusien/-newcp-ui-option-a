/**
 * Opens the help and support panel from anywhere in the app shell (footer
 * link, support button). A no-op outside SupportProvider, so callers never
 * need a guard.
 */

import { createContext, useContext } from 'react';

export interface SupportValue {
  openSupport: () => void;
}

export const SupportContextValue = createContext<SupportValue | null>(null);

const NOOP: SupportValue = { openSupport: () => undefined };

export function useSupport(): SupportValue {
  return useContext(SupportContextValue) ?? NOOP;
}
