/**
 * Toast context, types, and useToast hook (no components in this file).
 */

import { createContext, useContext } from 'react';

export type ToastSeverity = 'success' | 'error' | 'info';

export interface ToastOptions {
  severity?: ToastSeverity;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastState extends Required<Pick<ToastOptions, 'severity'>> {
  id: number;
  message: string;
  actionLabel: string | null;
  onAction: (() => void) | null;
}

export interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
  dismissToast: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx == null) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
