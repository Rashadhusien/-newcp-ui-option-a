/**
 * Primary navigation: the New CP demo features only.
 */

import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { ROUTES } from '@/app/routes';

export interface NavEntry {
  label: string;
  to: string;
  icon: React.ReactNode;
}

export interface NavGroup {
  label: string;
  entries: NavEntry[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Workspace',
    entries: [
      { label: 'Report', to: ROUTES.reporting, icon: <AssessmentOutlinedIcon /> },
      { label: 'Orders', to: ROUTES.orders, icon: <AssignmentOutlinedIcon /> },
      { label: 'Models', to: ROUTES.models, icon: <ViewInArOutlinedIcon /> },
      { label: 'Conversion', to: ROUTES.conversion, icon: <SyncAltOutlinedIcon /> },
    ],
  },
  {
    label: 'System',
    entries: [{ label: 'Settings', to: ROUTES.settings, icon: <SettingsOutlinedIcon /> }],
  },
];
