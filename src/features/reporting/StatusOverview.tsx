/**
 * Status overview tab (A18, after the earlier POC's "Status overview"
 * report): how many service INSTANCES sit in each status, per service type.
 * Statuses come from the data, never from a fixed list. Each status links
 * to the instance list filtered to it. Replaces the old count-chip rows.
 */

import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { StatusBadge } from '@/shared/components/basic';
import { presentStatus } from '@/shared/status/status';
import { SERVICE_TYPES } from './filterReport';
import { SERVICE_TYPE_LABEL, type ReportRow } from './types';

export interface StatusOverviewProps {
  rows: readonly ReportRow[];
  onOpenStatus: (status: string) => void;
}

export function StatusOverview({ rows, onOpenStatus }: StatusOverviewProps) {
  const statuses = [...new Set(rows.map((row) => row.status))].sort((a, b) =>
    presentStatus(a).label.localeCompare(presentStatus(b).label),
  );
  const count = (status: string, type?: string) =>
    rows.filter((row) => row.status === status && (type === undefined || row.serviceType === type)).length;

  return (
    <TableContainer>
      <Table size="small" aria-label="Service instances by status and service type">
        <TableHead>
          <TableRow>
            <TableCell scope="col">Status</TableCell>
            {SERVICE_TYPES.map((type) => (
              <TableCell key={type} scope="col" align="right">
                {SERVICE_TYPE_LABEL[type]}
              </TableCell>
            ))}
            <TableCell scope="col" align="right">
              Total
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {statuses.map((status) => (
            <TableRow key={status} hover>
              <TableCell component="th" scope="row">
                <Link
                  component="button"
                  type="button"
                  underline="none"
                  onClick={() => {
                    onOpenStatus(status);
                  }}
                  aria-label={`Show the ${presentStatus(status).label} services`}
                >
                  <StatusBadge status={status} size="sm" />
                </Link>
              </TableCell>
              {SERVICE_TYPES.map((type) => (
                <TableCell key={type} align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {count(status, type)}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {count(status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
