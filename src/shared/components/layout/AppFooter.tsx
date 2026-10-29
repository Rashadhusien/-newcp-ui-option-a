/**
 * Global footer (A17, from the earlier POC), once under every page of the
 * app shell, in the normal flow (bottom of the window on short pages, after
 * the content on long ones). Only facts the project can back: product name,
 * purpose, the package.json version, the data source and in-app links. No
 * external URL, contact or address is invented.
 */

import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import { APP_NAME, APP_VERSION } from '@/app/appInfo';
import { ROUTES } from '@/app/routes';
import { AppButton } from '@/shared/components/basic';
import { useSupport } from '@/shared/hooks/useSupport';
import { typographyTokens } from '@/theme/tokens';

const LINKS = [
  { to: ROUTES.reporting, label: 'Report' },
  { to: ROUTES.orders, label: 'All orders' },
  { to: ROUTES.settings, label: 'Settings' },
] as const;

/** Right padding keeps the last items clear of the floating support button (56 + 2 x 24). */
const FAB_CLEARANCE = 104;

export function AppFooter() {
  const { openSupport } = useSupport();
  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        pl: { xs: 2, md: 3 },
        pr: `${String(FAB_CLEARANCE)}px`,
        py: 2.5,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: 4,
        rowGap: 1.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {APP_NAME} · 3D Diagnostix
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p">
          Internal clerk portal, connected to the New CP API.
        </Typography>
      </Box>
      <Box
        component="nav"
        aria-label="Footer"
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 3, rowGap: 1 }}
      >
        {LINKS.map((link) => (
          <Link key={link.to} component={RouterLink} to={link.to} variant="body2" underline="hover" color="text.secondary">
            {link.label}
          </Link>
        ))}
        <AppButton variant="text" size="sm" startIcon={<SupportAgentOutlinedIcon />} onClick={openSupport}>
          Help and support
        </AppButton>
      </Box>
      <Typography variant="caption" color="text.secondary" component="p">
        <Box component="span" sx={{ fontFamily: typographyTokens.fontFamily.mono }}>
          v{APP_VERSION}
        </Box>
        {` · INTEGRATED · © ${String(new Date().getFullYear())} 3D Diagnostix`}
      </Typography>
    </Box>
  );
}
