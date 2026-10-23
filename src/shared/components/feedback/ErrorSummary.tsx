/**
 * ErrorSummary: lists every problem after a failed submit, each one a link
 * that moves focus to its field. Focus moves to the summary once per
 * attempt (`attempt` changes), so screen-reader users hear it first.
 * Adapted from the poc-mui ErrorSummary, without react-hook-form coupling.
 */

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Link from '@mui/material/Link';
import { useEffect, useRef } from 'react';
import { touchTargetTokens } from '@/theme/tokens';

export interface SummaryItem {
  key: string;
  label: string;
  message: string;
}

export interface ErrorSummaryProps {
  items: readonly SummaryItem[];
  /** Increments on each submit attempt; focus moves here when it changes. */
  attempt: number;
  onSelect: (key: string) => void;
}

export function ErrorSummary({ items, attempt, onSelect }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (attempt > 0 && hasItems) ref.current?.focus();
    // Once per attempt, not on every edit that changes the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (!hasItems || attempt === 0) return null;

  return (
    <Alert ref={ref} severity="error" tabIndex={-1} role="alert">
      <AlertTitle>
        {items.length === 1 ? 'There is 1 problem to fix' : `There are ${String(items.length)} problems to fix`}
      </AlertTitle>
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              component="button"
              type="button"
              color="inherit"
              underline="always"
              onClick={() => {
                onSelect(item.key);
              }}
              sx={{
                textAlign: 'left',
                verticalAlign: 'baseline',
                fontWeight: 600,
                // Touch target below 768 px (CLAUDE.md accessibility rules).
                minHeight: { xs: touchTargetTokens.minSize, md: 'auto' },
              }}
            >
              {item.label}
            </Link>
            : {item.message}
          </li>
        ))}
      </ul>
    </Alert>
  );
}
