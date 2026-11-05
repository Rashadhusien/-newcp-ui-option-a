/**
 * FormSection: a titled, labelled region of form fields with optional
 * non-blocking warnings. Two columns from md, one on phones.
 */

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId } from 'react';

export interface FormSectionProps {
  title: string;
  notes?: readonly string[];
  children: React.ReactNode;
}

export function FormSection({ title, notes = [], children }: FormSectionProps) {
  const headingId = useId();
  return (
    <Paper component="section" variant="outlined" aria-labelledby={headingId} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography id={headingId} variant="h3" component="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {notes.map((note) => (
        <Alert key={note} severity="warning" sx={{ mb: 2 }}>
          {note}
        </Alert>
      ))}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
        {children}
      </Box>
    </Paper>
  );
}
