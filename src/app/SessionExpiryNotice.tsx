/**
 * Session end warning (A36): a non-blocking banner shown 2 minutes before
 * the session ends, with a live countdown. There is no refresh endpoint, so
 * "Sign in again" signs out and returns to sign-in. "Stay signed in" is
 * offered only when inactivity is what ends the session (activity resets
 * it); a server expiry or the 8-hour limit cannot be extended.
 */

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { AppButton } from '@/shared/components/basic';

export interface SessionExpiryNoticeProps {
  open: boolean;
  /** Milliseconds until the session ends. */
  remainingMs: number;
  canStay: boolean;
  signingOut: boolean;
  onStay: () => void;
  onSignInAgain: () => void;
}

/** m:ss, rounded up so the banner opens on 2:00 and never shows 0:00 while still signed in. */
function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

export function SessionExpiryNotice({
  open,
  remainingMs,
  canStay,
  signingOut,
  onStay,
  onSignInAgain,
}: SessionExpiryNoticeProps) {
  return (
    <Snackbar open={open} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert
        severity="warning"
        variant="filled"
        action={
          <>
            {canStay && (
              <AppButton variant="text" size="sm" onClick={onStay}>
                Stay signed in
              </AppButton>
            )}
            <AppButton variant="text" size="sm" onClick={onSignInAgain} disabled={signingOut}>
              Sign in again
            </AppButton>
          </>
        }
      >
        <Typography variant="body2" component="span" aria-live="off">
          Your session ends in {formatCountdown(remainingMs)}
        </Typography>
      </Alert>
    </Snackbar>
  );
}
