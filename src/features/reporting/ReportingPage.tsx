/**
 * Models and Conversion report placeholder page. The real screen is built in A5.
 */

import { EmptyState } from '@/shared/components/feedback';
import { PageHeader } from '@/shared/components/layout';

export default function ReportingPage() {
  return (
    <>
      <PageHeader title="Models and Conversion report" />
      <EmptyState title="Not built yet" description="This screen arrives in a later task." />
    </>
  );
}
