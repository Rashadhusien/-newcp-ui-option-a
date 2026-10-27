/**
 * AppBreadcrumbs (A26): the trail of the current page, built by the pure
 * `buildTrail` from the route. Earlier crumbs are router links; the last is
 * plain text with aria-current="page". A crumb whose page needs a
 * capability the session lacks is plain text too (display only). Under the
 * phone breakpoint the middle crumbs collapse, so the trail never scrolls
 * sideways.
 */

import { useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { can } from '@/shared/api';
import { SessionContextValue } from '@/shared/hooks/useSession';
import { buildTrail, type TrailHints } from '@/shared/lib/breadcrumbs';

export interface AppBreadcrumbsProps {
  hints?: TrailHints;
}

export function AppBreadcrumbs({ hints }: AppBreadcrumbsProps) {
  const { pathname } = useLocation();
  // Read without throwing: the header also renders in isolated tests.
  const context = useContext(SessionContextValue)?.context ?? null;
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  const trail = buildTrail(pathname, hints);

  return (
    <Breadcrumbs
      component="nav"
      aria-label="Breadcrumb"
      maxItems={phone ? 2 : 8}
      itemsBeforeCollapse={1}
      itemsAfterCollapse={1}
      sx={{ mb: 1, typography: 'body2', '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' } }}
    >
      {trail.map((crumb, index) => {
        const last = index === trail.length - 1;
        const allowed = crumb.capability === undefined || can(context, crumb.capability);
        if (last || crumb.to === undefined || !allowed) {
          return (
            <Typography
              key={`${String(index)}-${crumb.label}`}
              variant="body2"
              color={last ? 'text.primary' : 'text.secondary'}
              aria-current={last ? 'page' : undefined}
              sx={{ overflowWrap: 'anywhere' }}
            >
              {crumb.label}
            </Typography>
          );
        }
        return (
          <Link
            key={`${String(index)}-${crumb.label}`}
            component={RouterLink}
            to={crumb.to}
            underline="hover"
            color="text.secondary"
            variant="body2"
          >
            {crumb.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
