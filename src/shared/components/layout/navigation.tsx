/**
 * Primary navigation (A33, D-81): top-level links and groups that open on
 * click. Labels follow the legacy CP / POC names ("All orders", "Add
 * order"); URLs are unchanged. A link with a capability is shown only when
 * the session context has it (display only; the server still decides), and
 * a group is shown only when one of its links is.
 */

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import DonutSmallOutlinedIcon from '@mui/icons-material/DonutSmallOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { ROUTES } from '@/app/routes';
import type { CapabilityCode } from '@/shared/api';

/** The current location, as the sidebar reads it. */
export interface NavLocation {
  pathname: string;
  search: string;
}

export interface NavLink {
  kind: 'link';
  label: string;
  to: string;
  icon: React.ReactNode;
  capability?: CapabilityCode;
  isActive: (location: NavLocation) => boolean;
}

export interface NavParent {
  kind: 'group';
  id: string;
  label: string;
  icon: React.ReactNode;
  links: NavLink[];
}

export type NavItem = NavLink | NavParent;

export interface NavSection {
  label: string;
  items: NavItem[];
}

const reportView = (search: string) => new URLSearchParams(search).get('view');
const ORDER_PAGE = /^\/orders\/(?!new(\/|$))[^/]+/;

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Workspace',
    items: [
      {
        kind: 'link',
        label: 'Home',
        to: ROUTES.home,
        icon: <HomeOutlinedIcon />,
        isActive: ({ pathname }) => pathname === ROUTES.home || pathname === ROUTES.root,
      },
      {
        kind: 'group',
        id: 'orders',
        label: 'Orders',
        icon: <AssignmentOutlinedIcon />,
        links: [
          {
            kind: 'link',
            label: 'All orders',
            to: ROUTES.orders,
            icon: <ListAltOutlinedIcon />,
            capability: 'orders.read',
            isActive: ({ pathname }) => pathname === ROUTES.orders || ORDER_PAGE.test(pathname),
          },
          {
            kind: 'link',
            label: 'Add order',
            to: ROUTES.orderNew,
            icon: <AddCircleOutlineOutlinedIcon />,
            capability: 'service.create',
            isActive: ({ pathname }) => pathname === ROUTES.orderNew,
          },
          {
            kind: 'link',
            label: 'Models',
            to: ROUTES.models,
            icon: <ViewInArOutlinedIcon />,
            capability: 'service.read',
            isActive: ({ pathname }) => pathname === ROUTES.models,
          },
          {
            kind: 'link',
            label: 'Conversion',
            to: ROUTES.conversion,
            icon: <SyncAltOutlinedIcon />,
            capability: 'service.read',
            isActive: ({ pathname }) => pathname === ROUTES.conversion,
          },
        ],
      },
      {
        kind: 'group',
        id: 'report',
        label: 'Report',
        icon: <AssessmentOutlinedIcon />,
        links: [
          {
            kind: 'link',
            label: 'Service instances',
            to: ROUTES.reporting,
            icon: <TableRowsOutlinedIcon />,
            capability: 'reports.view_all',
            isActive: ({ pathname, search }) => pathname === ROUTES.reporting && reportView(search) !== 'status',
          },
          {
            kind: 'link',
            label: 'Status overview',
            to: `${ROUTES.reporting}?view=status`,
            icon: <DonutSmallOutlinedIcon />,
            capability: 'reports.view_all',
            isActive: ({ pathname, search }) => pathname === ROUTES.reporting && reportView(search) === 'status',
          },
        ],
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        kind: 'link',
        label: 'Settings',
        to: ROUTES.settings,
        icon: <SettingsOutlinedIcon />,
        isActive: ({ pathname }) => pathname === ROUTES.settings,
      },
    ],
  },
];
