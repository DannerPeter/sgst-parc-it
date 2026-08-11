// ============================================================
// SIDEBAR.TSX - SGST GESTION PARC INFORMATIQUE
// Barre de navigation latérale
// ============================================================

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import {
  LayoutDashboard,
  Monitor,
  Ticket,
  Users,
  Building2,
  LogOut,
  User,
  BarChart3,
} from 'lucide-react'

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path
      ? 'bg-slate-100 text-slate-900 font-medium'
      : 'text-slate-600 hover:bg-slate-50'

  const role = profile?.role

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-slate-200 px-3 py-4">

      {/* ---- LOGO ---- */}
      <div className="px-3 mb-6">
        <h1 className="text-xl font-bold text-slate-800">SGST</h1>
        <p className="text-xs text-slate-400">Parc Informatique</p>
      </div>

      {/* ---- NAVIGATION ---- */}
      <nav className="flex-1 space-y-1">

        {/* Dashboard - tous */}
        <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/dashboard')}`}>
          <LayoutDashboard size={18} />
          Tableau de bord
        </Link>

        {/* Tickets - tous */}
        <Link to="/tickets" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/tickets')}`}>
          <Ticket size={18} />
          {role === 'employe' ? 'Mes demandes' : 'Tickets'}
        </Link>

        {/* Équipements - IT uniquement */}
        {role !== 'employe' && role !== 'dg' && (
          <Link to="/assets" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/assets')}`}>
            <Monitor size={18} />
            Équipements
          </Link>
        )}

        {/* Statistiques - DG + admin */}
        {(role === 'dg' || role === 'admin_principal') && (
          <Link to="/stats" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/stats')}`}>
            <BarChart3 size={18} />
            Statistiques
          </Link>
        )}

        {/* Administration - admin principal uniquement */}
        {role === 'admin_principal' && (
          <>
            <Separator className="my-2" />
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Administration
            </p>
            <Link to="/users" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/users')}`}>
              <Users size={18} />
              Utilisateurs
            </Link>
            <Link to="/departments" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/departments')}`}>
              <Building2 size={18} />
              Départements
            </Link>
          </>
        )}

      </nav>

      {/* ---- PROFIL + DÉCONNEXION ---- */}
      <div className="border-t border-slate-200 pt-4 space-y-1">
        <Link to="/profile" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive('/profile')}`}>
          <User size={18} />
          <div>
            <p className="font-medium text-slate-800 truncate">{profile?.full_name || profile?.email}</p>
            <p className="text-xs text-slate-400 capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut size={18} />
          Déconnexion
        </Button>
      </div>

    </div>
  )
}
