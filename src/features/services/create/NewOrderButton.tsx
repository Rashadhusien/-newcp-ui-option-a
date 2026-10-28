/**
 * "Add order" entry point (legacy label, D-81) to the create-order wizard (A21). Shown only with
 * the service-create capability (display only; the server decides).
 */

import { useNavigate } from 'react-router-dom';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { ROUTES } from '@/app/routes';
import { can } from '@/shared/api';
import { AppButton } from '@/shared/components/basic';
import { useSession } from '@/shared/hooks/useSession';

export function NewOrderButton() {
  const navigate = useNavigate();
  const { context } = useSession();
  if (!can(context, 'service.create')) return null;
  return (
    <AppButton
      startIcon={<AddOutlinedIcon />}
      onClick={() => {
        void navigate(ROUTES.orderNew);
      }}
    >
      Add order
    </AppButton>
  );
}
