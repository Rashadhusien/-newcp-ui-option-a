/**
 * Page header: title, optional meta row (status, priority, dates),
 * description, and actions on the right.
 *
 * `evidence`: pages that show data set it, and the data source badge leads
 * the actions, as the design system asks. `true` = INTEGRATED (the real
 * API, A38); a page without an endpoint passes MOCK or BLOCKED.
 *
 * Titles use the page-title scale (h1: 22/28 semibold).
 *
 * The breadcrumb trail (A26) sits above the title on every page;
 * `breadcrumbs` passes what the route alone cannot know (order, line).
 */

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ApiEvidence } from '@/shared/api';
import { EvidenceBadge } from '@/shared/components/feedback/EvidenceBadge';
import type { TrailHints } from '@/shared/lib/breadcrumbs';
import { AppBreadcrumbs } from './AppBreadcrumbs';

export interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  description?: string;
  /** Inline facts under the title, e.g. status and priority badges. */
  meta?: React.ReactNode;
  /** Show the data source badge: `true` = INTEGRATED, or the page's own label. */
  evidence?: boolean | ApiEvidence;
  /** Breadcrumb hints for dynamic segments the URL does not carry. */
  breadcrumbs?: TrailHints;
}

export function PageHeader({ title, action, description, meta, evidence = false, breadcrumbs }: PageHeaderProps) {
  return (
    <>
      <AppBreadcrumbs hints={breadcrumbs} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1">{title}</Typography>
          {meta != null && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {meta}
            </Stack>
          )}
          {description != null && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        {(action != null || evidence !== false) && (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {evidence !== false && <EvidenceBadge evidence={evidence === true ? 'INTEGRATED' : evidence} />}
            {action}
          </Stack>
        )}
      </Box>
    </>
  );
}
