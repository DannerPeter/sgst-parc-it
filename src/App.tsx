// ============================================================
// APP.TSX - SGST GESTION PARC INFORMATIQUE
// Routing principal de l'application
// Routes publiques : /login
// Routes protégées : /dashboard, /tickets, /assets, /profile
// Routes admin : /users, /departments
// Routes DG : /stats
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

// ---- PROFIL ----
import Profile from './pages/profile/Profile'

// ---- ADMINISTRATION ----
import UsersList from './pages/admin/UsersList'
import Departments from './pages/admin/Departments'

// ---- STATISTIQUES ----
import Stats from './pages/stats/Stats'

// ============================================================
// COMPOSANT : ProtectedRoute
// Vérifie que l'utilisateur est connecté
// Si roles[] est fourni, vérifie que le rôle est autorisé
// Sinon redirige vers /login ou /dashboard
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

  // Non connecté → login
  if (!profile) return <Navigate to="/login" replace />

  // Rôle non autorisé → dashboard
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
        {/* ROUTE PUBLIQUE                                       */}
        {/* -------------------------------------------------- */}
        <Route path="/login" element={<Login />} />
        // -- INSCRIPTION ADMIN INITIAL --
        <Route path="/register" element={<Register />} />

        {/* -------------------------------------------------- */}
        {/* ROUTES PROTÉGÉES - Layout avec Sidebar              */}
        {/* -------------------------------------------------- */}
        <Route element={<DashboardLayout />}>

          {/* -- DASHBOARD : tous les rôles -- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* -- TICKETS : tous les rôles -- */}
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketsList />
              </ProtectedRoute>
            }
          />

          {/* -- NOUVEAU TICKET : employé + admin -- */}
          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute roles={['employe', 'admin_principal', 'admin_it']}>
                <TicketForm />
              </ProtectedRoute>
            }
          />

          {/* -- DÉTAIL TICKET : tous les rôles -- */}
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            }
          />

          {/* -- ÉQUIPEMENTS : IT uniquement -- */}
          <Route
            path="/assets"
            element={
              <ProtectedRoute roles={['admin_principal', 'admin_it', 'adjoint_it']}>
                <AssetsList />
              </ProtectedRoute>
            }
          />

          {/* -- NOUVEL ÉQUIPEMENT : IT uniquement -- */}
          <Route
            path="/assets/new"
            element={
              <ProtectedRoute roles={['admin_principal', 'admin_it', 'adjoint_it']}>
                <AssetForm />
              </ProtectedRoute>
            }
          />

          {/* -- PROFIL : tous les rôles -- */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* -- UTILISATEURS : admin principal uniquement -- */}
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['admin_principal']}>
                <UsersList />
              </ProtectedRoute>
            }
          />

          {/* -- DÉPARTEMENTS & SERVICES : admin principal uniquement -- */}
          <Route
            path="/departments"
            element={
              <ProtectedRoute roles={['admin_principal']}>
                <Departments />
              </ProtectedRoute>
            }
          />

          {/* -- STATISTIQUES : DG + admin principal -- */}
          <Route
            path="/stats"
            element={
              <ProtectedRoute roles={['admin_principal', 'dg']}>
                <Stats />
              </ProtectedRoute>
            }
          />

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
