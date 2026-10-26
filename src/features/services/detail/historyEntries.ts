/**
 * History events of one instance as feed entries, newest first. Actor
 * names are not in the contract (Q-B6), so only the change and time show.
 */

import type { HistoryEvent } from '@/shared/api';
import type { ActivityEntry } from '@/shared/components/data-display';
import { formatDateTime } from '@/shared/lib/formatters';
import { presentStatus } from '@/shared/status/status';

export function historyEntries(history: readonly HistoryEvent[]): ActivityEntry[] {
  return [...history]
    .sort((a, b) => (b.occurredAt ?? '').localeCompare(a.occurredAt ?? ''))
    .map((event, index) => ({
      id: `${event.occurredAt ?? ''}-${String(index)}`,
      kind: 'note',
      title: `${event.fromCode ? presentStatus(event.fromCode).label : 'Created'} → ${
        event.toCode ? presentStatus(event.toCode).label : 'unknown'
      }`,
      details: event.comment,
      when: event.occurredAt ? formatDateTime(event.occurredAt) : 'Time not recorded',
    }));
}
