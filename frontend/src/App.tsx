import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import MapPage from './pages/MapPage';
import TrainsPage from './pages/TrainsPage';
import TrainDetailPage from './pages/TrainDetailPage';
import DislocationPage from './pages/DislocationPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dislocation" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dislocation" replace />} />
          <Route path="dislocation" element={<DislocationPage />} />
          <Route path="trains" element={<TrainsPage />} />
          <Route path="trains/:trainNumber" element={<TrainDetailPage />} />

          <Route element={<AdminRoute />}>
            <Route path="map" element={<MapPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dislocation" replace />} />
    </Routes>
  );
}
