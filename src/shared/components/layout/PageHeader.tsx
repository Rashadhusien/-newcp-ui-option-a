/**
 * Page header: title, optional meta row (status, priority, dates),
 * description, and actions on the right.
 *
 * `evidence`: pages that show service data set it, and the data source
 * badge (MOCK / INTEGRATED) leads the actions, as the design system asks.
 * On phones the app header shows the badge instead, so it is hidden here.
 *
 * Titles use the page-title scale (h1: 22/28 semibold).
 *
 * The breadcrumb trail (A26) sits above the title on every page;
 * `breadcrumbs` passes what the route alone cannot know (order, line).
 */

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { evidenceOf, readApiConfig } from '@/shared/api';
import { EvidenceBadge } from '@/shared/components/feedback/EvidenceBadge';
import type { TrailHints } from '@/shared/lib/breadcrumbs';
import { AppBreadcrumbs } from './AppBreadcrumbs';

const EVIDENCE = evidenceOf(readApiConfig());

export interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  description?: string;
  /** Inline facts under the title, e.g. status and priority badges. */
  meta?: React.ReactNode;
  /** Show the data source badge (pages with service data). */
  evidence?: boolean;
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
        {(action != null || evidence) && (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {evidence && (
              <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                <EvidenceBadge evidence={EVIDENCE} />
              </Box>
            )}
            {action}
          </Stack>
        )}
      </Box>
    </>
  );
}
