/**
 * ErrorState: shown when a data surface fails to load, with Retry.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  retryLabel = 'Retry',
}: ErrorStateProps) {
  return (
    <Box
      role="alert"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        py: 6,
        px: 3,
      }}
    >
      <ErrorOutlinedIcon color="error" fontSize="large" aria-hidden="true" />
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {onRetry != null && (
        <Button variant="contained" onClick={onRetry} sx={{ mt: 1 }}>
          {retryLabel}
        </Button>
      )}
    </Box>
  );
}
