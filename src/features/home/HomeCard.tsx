/**
 * One quick access card on Home: icon, title and one sentence; the whole
 * card is the link (or the button, for Help), so the touch target is the
 * card itself.
 */

import { Link as RouterLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { HomeCardSpec } from './homeCards';

export interface HomeCardProps {
  card: HomeCardSpec;
  /** Used when the card has no page (Help). */
  onSelect?: () => void;
}

export function HomeCard({ card, onSelect }: HomeCardProps) {
  const body = (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', p: 2.5, height: '100%' }}>
      <Stack aria-hidden="true" sx={{ color: 'primary.main', flexShrink: 0 }}>
        {card.icon}
      </Stack>
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <Typography variant="h3" component="h2">
          {card.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {card.description}
        </Typography>
      </Stack>
    </Stack>
  );
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      {card.to !== undefined ? (
        <CardActionArea component={RouterLink} to={card.to} sx={{ height: '100%' }}>
          {body}
        </CardActionArea>
      ) : (
        <CardActionArea onClick={onSelect} sx={{ height: '100%' }}>
          {body}
        </CardActionArea>
      )}
    </Card>
  );
}
