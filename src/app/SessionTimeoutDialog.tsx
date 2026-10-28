/**
 * Idle warning (A36): shown 2 minutes before the 30-minute idle sign-out.
 * Escape, the backdrop and "Stay signed in" all keep the session; only the
 * "Sign out" button ends it. MUI's Dialog traps focus and restores it.
 */

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { AppButton } from '@/shared/components/basic';

export interface SessionTimeoutDialogProps {
  open: boolean;
  /** Milliseconds left before the idle sign-out. */
  remainingMs: number;
  onStay: () => void;
  onSignOut: () => void;
}

function warningText(remainingMs: number): string {
  if (remainingMs < 60_000) return 'You will be signed out in less than a minute because there was no activity.';
  return `You will be signed out in ${String(Math.ceil(remainingMs / 60_000))} minutes because there was no activity.`;
}

export function SessionTimeoutDialog({ open, remainingMs, onStay, onSignOut }: SessionTimeoutDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onStay}
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-text"
    >
      <DialogTitle id="session-timeout-title">Are you still there?</DialogTitle>
      <DialogContent>
        <DialogContentText id="session-timeout-text" role="status">
          {warningText(remainingMs)}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <AppButton variant="text" onClick={onSignOut}>
          Sign out
        </AppButton>
        <AppButton onClick={onStay}>
          Stay signed in
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
