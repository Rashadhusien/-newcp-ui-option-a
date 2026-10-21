/**
 * Top-level providers: theme (light/dark/system), date pickers, toasts,
 * router.
 */

import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { theme } from '@/theme/theme';
import { ToastProvider } from '@/shared/components/feedback';
import { router } from './router';

export function Providers() {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
