// ============================================================
// APP.TSX - SGST GESTION PARC INFORMATIQUE
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import TicketsList from './pages/tickets/TicketsList'
import TicketForm from './pages/tickets/TicketForm'
import TicketDetail from './pages/tickets/TicketDetail'
import AssetsList from './pages/assets/AssetsList'
import AssetForm from './pages/assets/AssetForm'
import AssetDetail from './pages/assets/AssetDetail'
import Profile from './pages/profile/Profile'
import UsersList from './pages/admin/UsersList'
import Departments from './pages/admin/Departments'
import Stats from './pages/stats/Stats'

function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-500">Chargement...</p>
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  if (roles && !roles.includes(profile.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIQUES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTÉGÉES */}
        <Route element={<DashboardLayout />}>

          {/* DASHBOARD */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* TICKETS - URLs distinctes */}
          <Route path="/tickets" element={<ProtectedRoute><TicketsList /></ProtectedRoute>} />
          <Route path="/nouveau-ticket" element={
            <ProtectedRoute roles={['employe', 'admin_principal', 'admin_it']}>
              <TicketForm />
            </ProtectedRoute>
          } />
          <Route path="/ticket/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />

          {/* ÉQUIPEMENTS - URLs distinctes */}
          <Route path="/assets" element={
            <ProtectedRoute roles={['admin_principal', 'admin_it', 'adjoint_it']}>
              <AssetsList />
            </ProtectedRoute>
          } />
          <Route path="/nouvel-equipement" element={
            <ProtectedRoute roles={['admin_principal', 'admin_it', 'adjoint_it']}>
              <AssetForm />
            </ProtectedRoute>
          } />
          <Route path="/asset/:id" element={
            <ProtectedRoute roles={['admin_principal', 'admin_it', 'adjoint_it']}>
              <AssetDetail />
            </ProtectedRoute>
          } />

          {/* PROFIL */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* ADMIN */}
          <Route path="/users" element={<ProtectedRoute roles={['admin_principal']}><UsersList /></ProtectedRoute>} />
          <Route path="/departments" element={<ProtectedRoute roles={['admin_principal']}><Departments /></ProtectedRoute>} />

          {/* STATS */}
          <Route path="/stats" element={<ProtectedRoute roles={['admin_principal', 'dg']}><Stats /></ProtectedRoute>} />

        </Route>

        {/* DÉFAUT */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
