import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DatareonPage from './pages/DatareonPage'
import OrdersPage from './pages/OrdersPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DatareonPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
