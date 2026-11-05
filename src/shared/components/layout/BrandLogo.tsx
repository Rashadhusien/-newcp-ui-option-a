/**
 * BrandLogo (A33, D-82): the 3D Diagnostix logo next to the app name. The
 * image is the company asset `public/brand/3ddx-logo.png` (copied from the
 * iSmile app; replaced when the approved references arrive), so its colours
 * are not drawn in code. `showName` false keeps only the logo (narrow headers).
 */

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { APP_NAME } from '@/app/appInfo';
import { layoutTokens } from '@/theme/tokens';

const LOGO_SRC = `${import.meta.env.BASE_URL}brand/3ddx-logo.png`;

export interface BrandLogoProps {
  showName?: boolean;
}

export function BrandLogo({ showName = true }: BrandLogoProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        component="img"
        src={LOGO_SRC}
        alt="3D Diagnostix"
        sx={{ height: layoutTokens.logoHeight, width: 'auto', display: 'block', flexShrink: 0 }}
      />
      {showName && (
        <Typography variant="h3" component="span" noWrap>
          {APP_NAME}
        </Typography>
      )}
    </Stack>
  );
}
