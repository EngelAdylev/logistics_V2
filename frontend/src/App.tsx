import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';

// Stub pages — will be replaced in Task 15
const WagonsPage = () => <div>Wagons Page</div>;
const TripsPage = () => <div>Trips Page</div>;
const TripDetailPage = () => <div>Trip Detail Page</div>;

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
