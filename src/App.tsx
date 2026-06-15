import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AuditLogPage } from './pages/AuditLogPage'
import { DashboardPage } from './pages/DashboardPage'
import { HostsPage } from './pages/HostsPage'
import { HostDetailPage } from './pages/HostDetailPage'
import { PatchDetailPage } from './pages/PatchDetailPage'
import { PatchesPage } from './pages/PatchesPage'
import { ScanDetailPage } from './pages/ScanDetailPage'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="hosts" element={<HostsPage />} />
              <Route path="hosts/:hostId" element={<HostDetailPage />} />
              <Route path="hosts/:hostId/scan" element={<ScanDetailPage />} />
              <Route path="patches" element={<PatchesPage />} />
              <Route path="patches/:patchId" element={<PatchDetailPage />} />
              <Route path="audit-log" element={<AuditLogPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
