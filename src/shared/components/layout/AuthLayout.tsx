/**
 * AuthLayout: the signed-out page frame.
 *
 * Wide screens: a brand panel beside the form. Phones: the form alone with
 * the brand mark above it. The panel states what the portal does, with no
 * invented numbers.
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';

const POINTS = [
  'Models and Conversion services in one report',
  'Status and history for every service',
  'Each service tracked on its own',
];

function BrandMark() {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        aria-hidden="true"
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <MedicalServicesOutlinedIcon fontSize="small" />
      </Box>
      <Typography variant="h3" component="span">
        New CP
      </Typography>
    </Stack>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 5fr) minmax(0, 6fr)' },
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={(theme) => ({
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: 'primary.contrastText',
          backgroundImage: `linear-gradient(160deg, ${theme.vars?.palette.primary.dark ?? theme.palette.primary.dark}, ${theme.vars?.palette.primary.main ?? theme.palette.primary.main})`,
        })}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <MedicalServicesOutlinedIcon aria-hidden="true" />
          <Typography variant="h3" component="span" color="inherit">
            New CP
          </Typography>
        </Stack>
        <Box>
          <Typography variant="h1" component="p" color="inherit" sx={{ mb: 2 }}>
            The Case Portal, rebuilt.
          </Typography>
          <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0 }}>
            {POINTS.map((point) => (
              <Stack
                key={point}
                component="li"
                direction="row"
                spacing={1}
                sx={{ listStyle: 'none', alignItems: 'center' }}
              >
                <CheckCircleOutlineIcon fontSize="small" aria-hidden="true" />
                <Typography variant="body1" color="inherit">
                  {point}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Typography variant="caption" color="inherit">
          3D Diagnostix · New CP
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
        <Stack spacing={3} sx={{ width: '100%', maxWidth: 420 }}>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <BrandMark />
          </Box>
          <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
            {children}
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
