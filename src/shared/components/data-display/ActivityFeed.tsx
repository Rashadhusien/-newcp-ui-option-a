/**
 * ActivityFeed: newest-first timeline of orders, cases, files, and notes
 * (Angular patient / doctor / clinic / case "Activity" tabs). Entries with
 * a target are links.
 */

import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';

export interface ActivityEntry {
  id: string;
  kind: 'order' | 'case' | 'document' | 'note';
  title: string;
  details?: string;
  /** Already formatted, e.g. "3 days ago". */
  when: string;
  to?: string;
}

const ICONS: Record<ActivityEntry['kind'], React.ReactNode> = {
  order: <AssignmentOutlinedIcon fontSize="small" />,
  case: <FolderOpenOutlinedIcon fontSize="small" />,
  document: <DescriptionOutlinedIcon fontSize="small" />,
  note: <StickyNote2OutlinedIcon fontSize="small" />,
};

interface ActivityFeedProps {
  entries: readonly ActivityEntry[];
  label: string;
  emptyText?: string;
}

export function ActivityFeed({
  entries,
  label,
  emptyText = 'No activity yet.',
}: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }
  return (
    <Stack component="ol" spacing={2} aria-label={label} sx={{ m: 0, p: 0 }}>
      {entries.map((entry) => (
        <Box
          component="li"
          key={entry.id}
          sx={{ listStyle: 'none', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
        >
          <Box
            aria-hidden="true"
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: 1,
              bgcolor: 'action.hover',
              color: 'text.secondary',
            }}
          >
            {ICONS[entry.kind]}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {entry.to ? (
              <Link component={RouterLink} to={entry.to} variant="subtitle2" underline="hover">
                {entry.title}
              </Link>
            ) : (
              <Typography variant="subtitle2">{entry.title}</Typography>
            )}
            {entry.details && (
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {entry.details}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {entry.when}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
