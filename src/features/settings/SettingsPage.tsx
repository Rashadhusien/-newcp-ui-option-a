/**
 * Settings (design canvas "Shell, navigation, settings"): appearance and the
 * data source. The theme choice is a per-viewer convenience kept by MUI's
 * colour-scheme storage; on phones this is the only place to change it.
 * The data source is read-only: it follows VITE_USE_MOCKS.
 */

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { evidenceOf, readApiConfig } from '@/shared/api';
import { ThemeModeSwitch } from '@/shared/components/basic';
import { SectionCard } from '@/shared/components/data-display';
import { EvidenceBadge } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';

const EVIDENCE = evidenceOf(readApiConfig());

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <Stack spacing={3} sx={{ maxWidth: 640 }}>
        <SectionCard title="Appearance">
          <ThemeModeSwitch />
          <Typography variant="body2" color="text.secondary">
            System follows the device setting. The choice is kept in this browser only.
          </Typography>
        </SectionCard>
        <SectionCard title="Data source">
          <Stack direction="row">
            <EvidenceBadge evidence={EVIDENCE} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {EVIDENCE === 'MOCK'
              ? 'Mock data: nothing is saved to the New CP API. Mock data stays until a real API is demonstrated.'
              : 'Connected to the New CP API.'}
          </Typography>
        </SectionCard>
      </Stack>
    </>
  );
}
