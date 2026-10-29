/**
 * Settings option: where to go after signing in again (A37). A per-browser
 * preference; the page itself is saved when the session ends.
 */

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import { AppRadioGroup, type AppRadioOption } from '@/shared/components/basic';
import { SectionCard } from '@/shared/components/data-display';
import { readAfterSignIn, writeAfterSignIn, type AfterSignIn } from '@/shared/lib/returnTo';

const OPTIONS: readonly AppRadioOption[] = [
  { value: 'last', label: 'The page I was on' },
  { value: 'home', label: 'Home' },
];

export function AfterSignInSetting() {
  const [value, setValue] = useState<AfterSignIn>(readAfterSignIn);
  return (
    <SectionCard title="Signing in">
      <AppRadioGroup
        label="After signing in again, take me to"
        options={OPTIONS}
        value={value}
        onChange={(next) => {
          const choice: AfterSignIn = next === 'home' ? 'home' : 'last';
          setValue(choice);
          writeAfterSignIn(choice);
        }}
      />
      <Typography variant="body2" color="text.secondary">
        The choice is kept in this browser only. A saved page is never shared with another person who signs in.
      </Typography>
    </SectionCard>
  );
}
