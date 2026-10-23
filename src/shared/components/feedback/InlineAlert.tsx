/**
 * InlineAlert: in-page message (validation summaries, upload results,
 * cancelled-order notice). Toasts are for transient confirmations instead.
 */

import Alert from '@mui/material/Alert';

interface InlineAlertProps {
  severity: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
}

export function InlineAlert({ severity, children, action, onClose }: InlineAlertProps) {
  return (
    <Alert
      severity={severity}
      action={action}
      onClose={onClose}
      // MUI gives every Alert role="alert"; only problems should interrupt a screen reader.
      role={severity === 'error' || severity === 'warning' ? 'alert' : 'status'}
    >
      {children}
    </Alert>
  );
}
