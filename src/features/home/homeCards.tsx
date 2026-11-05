/**
 * Quick access cards on Home (A27). A card with a capability shows only
 * when the session context has it (display only; the server decides). The
 * capabilities match the pages' own gates, so FINANCE and QC get the report,
 * all orders, settings and help (G11, D-87). Help opens the support panel instead of a page.
 */

import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import { ROUTES } from '@/app/routes';
import { can, type CapabilityCode, type SessionContext } from '@/shared/api';

export interface HomeCardSpec {
  title: string;
  description: string;
  icon: React.ReactNode;
  /** Page to open; absent for Help, which opens the support panel. */
  to?: string;
  capability?: CapabilityCode;
}

export const HOME_CARDS: readonly HomeCardSpec[] = [
  {
    title: 'Report',
    description: 'Models and Conversion services, one row per service instance.',
    icon: <AssessmentOutlinedIcon />,
    to: ROUTES.reporting,
    capability: 'reports.view_all',
  },
  {
    title: 'All orders',
    description: 'Orders with their services; open one to edit, move or review it.',
    icon: <AssignmentOutlinedIcon />,
    to: ROUTES.orders,
    capability: 'orders.read',
  },
  {
    title: 'New Biomodel',
    description: 'Start a Biomodel service on an order from the Models page.',
    icon: <ViewInArOutlinedIcon />,
    to: ROUTES.models,
    capability: 'service.create',
  },
  {
    title: 'New Conversion',
    description: 'Start a Conversion service on an order from the Conversion page.',
    icon: <SyncAltOutlinedIcon />,
    to: ROUTES.conversion,
    capability: 'service.create',
  },
  {
    title: 'Settings',
    description: 'Theme, data source and version of this demo.',
    icon: <SettingsOutlinedIcon />,
    to: ROUTES.settings,
  },
  {
    title: 'Help and support',
    description: 'Write a support request draft; nothing is sent in this demo.',
    icon: <SupportAgentOutlinedIcon />,
  },
];

export function visibleHomeCards(context: SessionContext | null): HomeCardSpec[] {
  return HOME_CARDS.filter((card) => card.capability === undefined || can(context, card.capability));
}
