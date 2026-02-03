import { useEffect } from 'react';
import { useLogout } from '../hooks/useAuth';
import { PageLoader } from '@/components/common/PageLoader';

export default function LogoutPage() {
  const { mutate: logout } = useLogout();

  useEffect(() => {
    logout();
  }, [logout]);

  return <PageLoader />;
}
