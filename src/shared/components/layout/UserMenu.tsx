/**
 * Header account menu: the signed-in user, roles and tenant from the
 * session context (display only), and sign out.
 */

import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSession } from '@/shared/hooks/useSession';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { context, signOut, signingOut = false } = useSession();
  if (!context) return null;
  const user = { name: context.user.displayName };
  const roles = context.roles.length > 0 ? context.roles.join(', ') : 'No role';

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          aria-label={`Account: ${user.name}`}
          aria-haspopup="menu"
          aria-expanded={anchor != null ? 'true' : undefined}
          onClick={(event) => {
            setAnchor(event.currentTarget);
          }}
        >
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: 'primary.main', typography: 'caption' }}
            aria-hidden="true"
          >
            {initialsOf(user.name)}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={anchor != null}
        onClose={() => {
          setAnchor(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ list: { 'aria-label': 'Account' }, paper: { sx: { minWidth: 240 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p" noWrap>
            Role: {roles}
          </Typography>
          {context.activeTenant && (
            <Typography variant="caption" color="text.secondary" component="p" noWrap>
              Tenant: {context.activeTenant.label}
            </Typography>
          )}
        </Box>
        <Divider />
        <MenuItem
          disabled={signingOut}
          onClick={signOut}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
