/**
 * Settings (A22, POC-1 `src/features/settings/SettingsPage.tsx`): section
 * tabs kept in `?tab=`, one SectionCard per section. Only what the app
 * really has is interactive: the theme (a per-viewer convenience kept by
 * MUI's colour-scheme storage; on phones the only place to change it).
 * Account facts come from the session context and are read-only: the
 * frontend never edits a name, role, tenant or capability. The data source
 * follows VITE_USE_MOCKS. Profile, notifications and password have no
 * backend: they are listed as "Not available in this demo", with no control.
 */

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { APP_NAME, APP_VERSION } from '@/app/appInfo';
import { evidenceOf, readApiConfig } from '@/shared/api';
import { ThemeModeSwitch } from '@/shared/components/basic';
import { DetailList, SectionCard, SectionTabs, sectionTabIds, type SectionTab } from '@/shared/components/data-display';
import { EvidenceBadge } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';
import { useSession } from '@/shared/hooks/useSession';
import { useTabParam } from '@/shared/hooks/useTabParam';

const EVIDENCE = evidenceOf(readApiConfig());

const SECTIONS = ['account', 'appearance', 'data', 'about'] as const;
type Section = (typeof SECTIONS)[number];

const TABS: readonly SectionTab<Section>[] = [
  { value: 'account', label: 'Account' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'data', label: 'Data source' },
  { value: 'about', label: 'About' },
];

const ID_PREFIX = 'settings';

/** Pages and fields that never reach the New CP API, whatever the data source. */
const MOCK_ONLY = [
  'Bill To (payer per service): BLOCKED until the database has the F07 columns',
  'Orders list and create order: no endpoint yet',
  'Session context (roles, tenant, capabilities): not in the OpenAPI yet',
] as const;

const NOT_AVAILABLE = ['Profile editing', 'Notifications', 'Password and security'] as const;

function AccountSection() {
  const { context } = useSession();
  if (!context) {
    return (
      <Typography variant="body2" color="text.secondary">
        No session information.
      </Typography>
    );
  }
  return (
    <Stack spacing={3}>
      <SectionCard title="Account">
        <DetailList
          columns={2}
          items={[
            { label: 'Name', value: context.user.displayName },
            { label: 'Sign-in', value: 'Google account' },
            { label: 'Access', value: context.accessStatus === 'AUTHORIZED' ? 'Authorized' : 'Pending' },
            { label: 'Tenant', value: context.activeTenant?.label ?? 'Not assigned' },
            {
              label: 'Roles',
              wide: true,
              value: (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {context.roles.map((role) => (
                    <Chip key={role} size="small" label={role} aria-label={`Role: ${role}`} />
                  ))}
                </Stack>
              ),
            },
          ]}
        />
        <Typography variant="body2" color="text.secondary">
          Your access is assigned on the server. Ask an administrator to change your roles or tenant.
        </Typography>
      </SectionCard>
      <SectionCard title="Not available in this demo">
        <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
          {NOT_AVAILABLE.map((item) => (
            <Typography component="li" variant="body2" key={item}>
              {item}
            </Typography>
          ))}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          These have no New CP backend yet. Your Google account manages your password.
        </Typography>
      </SectionCard>
    </Stack>
  );
}

function AppearanceSection() {
  return (
    <SectionCard title="Appearance">
      <Stack spacing={1}>
        <Typography variant="subtitle2" component="p" aria-hidden="true">
          Theme
        </Typography>
        <ThemeModeSwitch />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        System follows the device setting. The choice is kept in this browser only.
      </Typography>
    </SectionCard>
  );
}

function DataSection() {
  return (
    <SectionCard title="Data source" action={<EvidenceBadge evidence={EVIDENCE} />}>
      <Typography variant="body2">
        {EVIDENCE === 'MOCK'
          ? 'Mock data: nothing is saved to the New CP API. Mock data stays until a real API is demonstrated.'
          : 'Connected to the New CP API.'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Set by the deployment (VITE_USE_MOCKS); it cannot be changed here. These stay mock only:
      </Typography>
      <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
        {MOCK_ONLY.map((item) => (
          <Typography component="li" variant="body2" key={item}>
            {item}
          </Typography>
        ))}
      </Stack>
    </SectionCard>
  );
}

function AboutSection() {
  return (
    <SectionCard title="About">
      <DetailList
        columns={2}
        items={[
          { label: 'Application', value: APP_NAME },
          { label: 'Version', value: APP_VERSION },
          { label: 'Build', value: import.meta.env.DEV ? 'Development' : 'Production' },
          { label: 'Data source', value: EVIDENCE },
        ]}
      />
      <Typography variant="body2" color="text.secondary">
        Internal clerk workspace for Biomodel and Conversion services. Demo build: data is synthetic.
      </Typography>
    </SectionCard>
  );
}

const PANELS: Record<Section, () => React.ReactNode> = {
  account: AccountSection,
  appearance: AppearanceSection,
  data: DataSection,
  about: AboutSection,
};

export default function SettingsPage() {
  const [section, setSection] = useTabParam(SECTIONS);
  const Panel = PANELS[section];
  const ids = sectionTabIds(ID_PREFIX, section);

  return (
    <>
      <PageHeader title="Settings" description="Your account, appearance and what this demo is connected to." />
      <Stack sx={{ maxWidth: 720 }}>
        <SectionTabs tabs={TABS} value={section} onChange={setSection} ariaLabel="Settings sections" idPrefix={ID_PREFIX} />
        <div role="tabpanel" id={ids.panel} aria-labelledby={ids.tab}>
          <Panel />
        </div>
      </Stack>
    </>
  );
}
