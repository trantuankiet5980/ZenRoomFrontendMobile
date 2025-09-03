import { useSelector } from 'react-redux';
export function useRole() {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  return {
    role,
    isTenant: role === 'tenant',
    isLandlord: role === 'landlord',
    isAdmin: role === 'admin',
  };
}
