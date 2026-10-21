/**
 * Conversion placeholder page. The real screen is built in A8.
 */

import { EmptyState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';

export default function ConversionPage() {
  return (
    <>
      <PageHeader title="Conversion" />
      <EmptyState title="Not built yet" description="This screen arrives in a later task." />
    </>
  );
}
