/**
 * Models placeholder page. The real screen is built in A6 and A7.
 */

import { EmptyState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';

export default function ModelsPage() {
  return (
    <>
      <PageHeader title="Models" />
      <EmptyState title="Not built yet" description="This screen arrives in a later task." />
    </>
  );
}
