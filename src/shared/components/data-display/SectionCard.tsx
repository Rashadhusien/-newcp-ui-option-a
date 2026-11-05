/**
 * SectionCard: a titled, flat, bordered block for detail and form pages
 * (design system "Flat and bordered"; card padding 20, section title h2).
 * Use it instead of ad-hoc Paper sections so every page reads the same.
 */

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { spacingTokens } from '@/theme/tokens';

export interface SectionCardProps {
  title: string;
  /** Optional element right of the title (a badge or a small action). */
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <Paper
      variant="outlined"
      component="section"
      aria-label={title}
      sx={{ p: { xs: 2, sm: `${String(spacingTokens.cardPadding)}px` } }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h2" component="h2">
            {title}
          </Typography>
          {action}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}
