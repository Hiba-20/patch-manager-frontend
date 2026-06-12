import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { HostsPage } from './pages/HostsPage'
import { HostDetailPage } from './pages/HostDetailPage'
import { ScanDetailPage } from './pages/ScanDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="hosts" element={<HostsPage />} />
          <Route path="hosts/:hostId" element={<HostDetailPage />} />
          <Route path="hosts/:hostId/scan" element={<ScanDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
