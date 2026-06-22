import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './components/shared/Toast'
import { ActiveDeploymentsProvider } from './hooks/useActiveDeployments'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AuditLogPage } from './pages/AuditLogPage'
import { InvitesPage } from './pages/InvitesPage'
import { DashboardPage } from './pages/DashboardPage'
import { GroupsPage } from './pages/GroupsPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { HostsPage } from './pages/HostsPage'
import { HostDetailPage } from './pages/HostDetailPage'
import { PatchDetailPage } from './pages/PatchDetailPage'
import { PatchesPage } from './pages/PatchesPage'
import { ScanDetailPage } from './pages/ScanDetailPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <ActiveDeploymentsProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
              <Route path="hosts" element={<ErrorBoundary><HostsPage /></ErrorBoundary>} />
              <Route path="hosts/:hostId" element={<ErrorBoundary><HostDetailPage /></ErrorBoundary>} />
              <Route path="hosts/:hostId/scan" element={<ErrorBoundary><ScanDetailPage /></ErrorBoundary>} />
              <Route path="groups" element={<ErrorBoundary><GroupsPage /></ErrorBoundary>} />
              <Route path="groups/:groupId" element={<ErrorBoundary><GroupDetailPage /></ErrorBoundary>} />
              <Route path="patches" element={<ErrorBoundary><PatchesPage /></ErrorBoundary>} />
              <Route path="patches/:patchId" element={<ErrorBoundary><PatchDetailPage /></ErrorBoundary>} />
              <Route path="audit-log" element={<ErrorBoundary><AuditLogPage /></ErrorBoundary>} />
              <Route path="settings/invites" element={<ErrorBoundary><InvitesPage /></ErrorBoundary>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
        </ActiveDeploymentsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
