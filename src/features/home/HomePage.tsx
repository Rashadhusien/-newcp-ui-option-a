/**
 * Home (A27): the landing page after sign-in (a safe return path still
 * wins). A greeting with the user's name, roles and the read-only tenant,
 * all from the session context, then quick access cards for what the role
 * may open. Nothing here is hard-coded per tenant, role or permission, and
 * there are no counts or activity: Home only points to pages. Pending Access
 * users never reach it (AuthBoundary shows Pending Access instead).
 */

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { TenantBadge } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';
import { useSupport } from '@/shared/hooks/useSupport';
import { HomeCard } from './HomeCard';
import { visibleHomeCards } from './homeCards';

export default function HomePage() {
  const { context } = useSession();
  const { openSupport } = useSupport();
  const cards = visibleHomeCards(context);
  const name = context?.user.displayName ?? '';

  return (
    <>
      <PageHeader
        title={name === '' ? 'Welcome' : `Welcome, ${name}`}
        description="Choose where to start."
        evidence
        meta={
          context ? (
            <>
              {context.roles.map((role) => (
                <Chip key={role} size="small" label={role} aria-label={`Role: ${role}`} />
              ))}
              {context.activeTenant && <TenantBadge tenant={context.activeTenant} />}
            </>
          ) : undefined
        }
      />
      <Box
        component="ul"
        aria-label="Quick access"
        sx={{
          m: 0,
          p: 0,
          listStyle: 'none',
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        {cards.map((card) => (
          <li key={card.title}>
            <HomeCard card={card} onSelect={card.to === undefined ? openSupport : undefined} />
          </li>
        ))}
      </Box>
    </>
  );
}
