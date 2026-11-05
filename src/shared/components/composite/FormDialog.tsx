/**
 * FormDialog: modal form (Angular entity-dialog) for add/edit flows.
 *
 * The body is a real <form>, so Enter submits and native constraint
 * attributes still work; validation messages come from the caller.
 * Full-screen on phones; Esc / backdrop do not close while saving.
 */

import { useId } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AppButton } from '@/shared/components/basic/AppButton';

interface FormDialogProps {
  open: boolean;
  title: string;
  description?: string;
  submitLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  destructive?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md';
  /** Extra action shown at the left of the footer (e.g. "Clear all"). */
  secondaryAction?: React.ReactNode;
  onSubmit: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function FormDialog({
  open,
  title,
  description,
  submitLabel,
  cancelLabel = 'Cancel',
  loading = false,
  error = null,
  destructive = false,
  maxWidth = 'sm',
  secondaryAction,
  onSubmit,
  onClose,
  children,
}: FormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      fullWidth
      maxWidth={maxWidth}
      fullScreen={fullScreen}
      aria-labelledby={titleId}
    >
      <Box
        component="form"
        noValidate
        onSubmit={(event: React.SyntheticEvent) => {
          event.preventDefault();
          if (!loading) onSubmit();
        }}
        sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}
      >
        <DialogTitle id={titleId}>
          {title}
          {description != null && (
            <Typography variant="body2" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {error != null && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {children}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {secondaryAction != null && <Box sx={{ mr: 'auto' }}>{secondaryAction}</Box>}
          <AppButton variant="text" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </AppButton>
          <AppButton type="submit" variant={destructive ? 'danger' : 'primary'} loading={loading}>
            {submitLabel}
          </AppButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
