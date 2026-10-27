/**
 * Primary navigation: the New CP demo features only. An entry with a
 * capability is shown only when the session context has it (display only;
 * the server still decides). FINANCE and QC therefore see the report only.
 */

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { ROUTES } from '@/app/routes';
import type { CapabilityCode } from '@/shared/api';

export interface NavEntry {
  label: string;
  to: string;
  icon: React.ReactNode;
  capability?: CapabilityCode;
}

export interface NavGroup {
  label: string;
  entries: NavEntry[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Workspace',
    entries: [
      { label: 'Home', to: ROUTES.home, icon: <HomeOutlinedIcon /> },
      { label: 'Dashboard', to: ROUTES.dashboard, icon: <DashboardOutlinedIcon />, capability: 'reports.view_all' },
      { label: 'Report', to: ROUTES.reporting, icon: <AssessmentOutlinedIcon />, capability: 'reports.view_all' },
      { label: 'Orders', to: ROUTES.orders, icon: <AssignmentOutlinedIcon />, capability: 'orders.read' },
      { label: 'Models', to: ROUTES.models, icon: <ViewInArOutlinedIcon />, capability: 'service.read' },
      { label: 'Conversion', to: ROUTES.conversion, icon: <SyncAltOutlinedIcon />, capability: 'service.read' },
    ],
  },
  {
    label: 'System',
    entries: [{ label: 'Settings', to: ROUTES.settings, icon: <SettingsOutlinedIcon /> }],
  },
];
