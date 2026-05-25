import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';
import WagonsPage from './pages/WagonsPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/map" replace />} />
        <Route path="map"      element={<MapPage />} />
        <Route path="wagons"   element={<WagonsPage />} />
        <Route path="trips"    element={<TripsPage />} />
        <Route path="trips/:id" element={<TripDetailPage />} />
      </Route>
    </Routes>
  );
}
