/**
 * Settings placeholder page. The real screen is built in a later task [NEEDS VERIFICATION: no settings scope in PLAN section 3].
 */

import { EmptyState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <EmptyState title="Not built yet" description="This screen arrives in a later task." />
    </>
  );
}
