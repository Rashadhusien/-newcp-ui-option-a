/**
 * Toast system (FR-FB-02).
 *
 * One toast visible at a time (a new toast replaces the current one).
 * Success/info use role="status" (aria-live polite); errors use
 * role="alert" (assertive). Errors with an action stay until dismissed.
 * Closing keeps the content until the exit transition ends, so a closing
 * toast never flashes as an empty "info" alert.
 */

import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { ToastContext } from './toast-context';
import type { ToastOptions, ToastState } from './toast-context';

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [open, setOpen] = useState(false);

  const dismissToast = useCallback(() => {
    setOpen(false);
  }, []);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    toastId += 1;
    setToast({
      id: toastId,
      message,
      severity: options?.severity ?? 'info',
      actionLabel: options?.actionLabel ?? null,
      onAction: options?.onAction ?? null,
    });
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  const autoHide = toast?.severity === 'error' && toast.actionLabel != null ? null : 5000;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.id}
        open={open && toast != null}
        slotProps={{
          transition: {
            onExited: () => {
              setToast(null);
            },
          },
        }}
        autoHideDuration={autoHide}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') {
            dismissToast();
          }
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.severity ?? 'info'}
          role={toast?.severity === 'error' ? 'alert' : 'status'}
          onClose={dismissToast}
          action={
            toast?.actionLabel != null && toast.onAction != null ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast();
                }}
              >
                {toast.actionLabel}
              </Button>
            ) : undefined
          }
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
