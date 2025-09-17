import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { connectNotificationsSocket, disconnectNotificationsSocket } from './useNotificationsSocket';

export default function NotificationsSocketManager() {
  const user = useSelector(s => s.auth.user);
  const role = String(user?.role || user?.roleName || '').toLowerCase();

  useEffect(() => {
    if (user?.userId) connectNotificationsSocket(role);
    return () => disconnectNotificationsSocket();
  }, [user?.userId, role]);

  return null; // không render gì
}
