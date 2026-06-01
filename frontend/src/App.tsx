import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import MapPage from './pages/MapPage';
import TrainsPage from './pages/TrainsPage';
import TrainDetailPage from './pages/TrainDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/trains" replace />} />
          <Route path="trains" element={<TrainsPage />} />
          <Route path="trains/:trainNumber" element={<TrainDetailPage />} />

          <Route element={<AdminRoute />}>
            <Route path="map" element={<MapPage />} />
            <Route path="invoices" element={<div>Накладные — в разработке</div>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/trains" replace />} />
    </Routes>
  );
}
