/**
 * LoadingState: skeleton placeholder for a data surface.
 */

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

interface LoadingStateProps {
  label?: string;
  rows?: number;
}

export function LoadingState({ label = 'Loading…', rows = 3 }: LoadingStateProps) {
  return (
    <Box role="status" aria-label={label} sx={{ py: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={`loading-row-${String(i)}`} variant="rounded" height={44} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}
