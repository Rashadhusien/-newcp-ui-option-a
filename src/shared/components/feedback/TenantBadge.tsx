/**
 * TenantBadge: the active tenant from the session context, read-only
 * (tenant spec D3: informational badge, no editable tenant control). Icon +
 * text, never colour alone. Hidden on phones to keep the header on one line;
 * the account menu repeats the tenant there.
 */

import Chip from '@mui/material/Chip';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import type { ActiveTenant } from '@/shared/api';

export interface TenantBadgeProps {
  tenant: ActiveTenant;
}

export function TenantBadge({ tenant }: TenantBadgeProps) {
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<ApartmentOutlinedIcon aria-hidden="true" />}
      label={tenant.label}
      aria-label={`Active tenant: ${tenant.label} (read-only)`}
      sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
    />
  );
}
