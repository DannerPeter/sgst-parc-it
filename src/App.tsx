// ============================================================
// APP.TSX - SGST GESTION PARC INFORMATIQUE
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// ---- LAYOUT ----
import DashboardLayout from './components/layout/DashboardLayout'

// ---- AUTH ----
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// ---- DASHBOARD ----
import Dashboard from './pages/dashboard/Dashboard'

// ---- TICKETS ----
import TicketsList from './pages/tickets/TicketsList'
import TicketForm from './pages/tickets/TicketForm'
import TicketDetail from './pages/tickets/TicketDetail'

// ---- ÉQUIPEMENTS ----
import AssetsList from './pages/assets/AssetsList'
import AssetForm from './pages/assets/AssetForm'
import AssetDetail from './pages/assets/AssetDetail'

// ---- PROFIL ----
import Profile from './pages/profile/Profile'

// ---- ADMINISTRATION ----
import UsersList from './pages/admin/UsersList'
import Departments from './pages/admin/Departments'

// ---- STATISTIQUES ----
import Stats from './pages/stats/Stats'

// ============================================================
// COMPOSANT : ProtectedRoute
// ============================================================
function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Chargement...</p>
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// ============================================================
// COMPOSANT PRINCIPAL : App
// ============================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* -------------------------------------------------- */}
        {/* ROUTES PUBLIQUES                                     */}
        {/* -------------------------------------------------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* -------------------------------------------------- */}
        {/* ROUTES PROTÉGÉES - Layout avec Sidebar              */}
        {/* -------------------------------------------------- */}
        <Route element={<DashboardLayout />}>

          {/* -- DASHBOARD -- */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* -- TICKETS : ordre STRICT new avant :id -- */}
          <Route path="/tickets" element={
            <ProtectedRoute><TicketsList /></ProtectedRoute>
          } />
          <Route path="/tickets/new" element={
            <ProtectedRoute roles={['employe', 'admin_principal', 'admin_it']}>
              <TicketForm />
            </ProtectedRoute>
          } />
          <Route path="/tickets/:id" element={
            <ProtectedRoute><TicketDetail /></ProtectedRoute>
          } />

          {/* -- ÉQUIPEMENTS : ordre STRICT new avant :id -- */}
          <Route path="/assets" element={
            <ProtectedRoute roles={['admin_principal', 'admin_it', 'adjoint_it']}>
              <AssetsList />
            </ProtectedRoute>
          } />
          <Route path="/assets/new" element={
            <ProtectedRoute roles={['admin_principal', 'admin_it', 'adjoint_it']}>
              <AssetForm />
            </ProtectedRoute>
          } />
          <Route path="/assets/:id" element={
            <ProtectedRoute roles={['admin_principal', 'admin_it', 'adjoint_it']}>
              <AssetDetail />
            </ProtectedRoute>
          } />

          {/* -- PROFIL -- */}
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          {/* -- ADMINISTRATION -- */}
          <Route path="/users" element={
            <ProtectedRoute roles={['admin_principal']}>
              <UsersList />
            </ProtectedRoute>
          } />
          <Route path="/departments" element={
            <ProtectedRoute roles={['admin_principal']}>
              <Departments />
            </ProtectedRoute>
          } />

          {/* -- STATISTIQUES -- */}
          <Route path="/stats" element={
            <ProtectedRoute roles={['admin_principal', 'dg']}>
              <Stats />
            </ProtectedRoute>
          } />

        </Route>

        {/* -------------------------------------------------- */}
        {/* REDIRECTIONS PAR DÉFAUT                             */}
        {/* -------------------------------------------------- */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
