/**
 * Step 2, services (A21): Biomodel and Conversion, from the catalog. Each
 * "Add" creates a separate instance, so an order can hold two of the same
 * type, each with its own answers, teeth and (later) status.
 */

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import type { CatalogService } from '@/shared/api';
import { AppButton } from '@/shared/components/basic';
import { InlineAlert } from '@/shared/components/feedback';
import { MAX_PER_SERVICE, type CreateOrderWizard } from './useCreateOrderWizard';

export interface ServicesStepProps {
  wizard: CreateOrderWizard;
  services: readonly { service: CatalogService; prefix: string }[];
}

export function ServicesStep({ wizard, services }: ServicesStepProps) {
  const { state, addInstance, removeInstance, showBlocked } = wizard;
  return (
    <Stack spacing={2}>
      {showBlocked && state.instances.length === 0 && (
        <InlineAlert severity="warning">Add at least one service to continue.</InlineAlert>
      )}
      <Box
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' } }}
      >
        {services.map(({ service, prefix }) => {
          const instances = state.instances.filter((instance) => instance.serviceUuid === service.uuid);
          const Icon = prefix === 'biomodel' ? ViewInArOutlinedIcon : SyncAltOutlinedIcon;
          return (
            <Paper key={service.uuid} variant="outlined" sx={{ p: 2.5 }} component="section" aria-label={service.name}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                  <Icon color="primary" aria-hidden="true" />
                  <Typography variant="h3" component="h2" sx={{ flex: 1 }}>
                    {service.name}
                  </Typography>
                  <AppButton
                    variant="secondary"
                    size="sm"
                    startIcon={<AddOutlinedIcon />}
                    disabled={instances.length >= MAX_PER_SERVICE}
                    onClick={() => {
                      addInstance(service.uuid, prefix);
                    }}
                  >
                    {instances.length === 0 ? `Add ${service.name}` : `Add another ${service.name}`}
                  </AppButton>
                </Stack>
                {instances.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Not on this order.
                  </Typography>
                ) : (
                  <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                    {instances.map((instance, index) => (
                      <Stack key={instance.id} component="li" direction="row" sx={{ alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {`${service.name} ${String(index + 1)}`}
                        </Typography>
                        <Tooltip title="Remove">
                          <IconButton
                            size="small"
                            aria-label={`Remove ${service.name} ${String(index + 1)}`}
                            onClick={() => {
                              removeInstance(instance.id);
                            }}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>
    </Stack>
  );
}
