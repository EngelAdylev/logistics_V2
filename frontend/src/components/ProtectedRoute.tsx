import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { auth } = useAuth();
  if (auth?.role !== 'ADMIN') return <Navigate to="/dislocation" replace />;
  return <Outlet />;
}
