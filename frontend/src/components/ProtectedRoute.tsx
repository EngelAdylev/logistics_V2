import { Outlet } from 'react-router-dom';

// Auth temporarily disabled
export function ProtectedRoute() {
  return <Outlet />;
}

export function AdminRoute() {
  return <Outlet />;
}
