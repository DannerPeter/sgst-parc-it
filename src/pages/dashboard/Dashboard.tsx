// ============================================================
// DASHBOARD.TSX - SGST GESTION PARC INFORMATIQUE
// Vue Admin IT / Adjoint : cartes utilisateurs avec LED statut
// Vue Employé : ses propres infos + tickets
// Vue DG : statistiques globales
// ============================================================

import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Monitor, Ticket, Users, CheckCircle, AlertTriangle, Clock, Printer, Wifi } from 'lucide-react'

// ---- COMPOSANT LED ----
function Led({ status }: { status: string }) {
  const colors: Record<string, string> = {
    en_service: 'bg-green-500 shadow-green-400',
    en_panne_signalee: 'bg-orange-500 shadow-orange-400',
    en_panne: 'bg-yellow-400 shadow-yellow-300',
    hors_service: 'bg-red-600 shadow-red-500',
    en_maintenance: 'bg-yellow-400 shadow-yellow-300',
    en_stock: 'bg-slate-400 shadow-slate-300',
    reforme: 'bg-red-600 shadow-red-500',
  }
  const labels: Record<string, string> = {
    en_service: 'OK',
    en_panne_signalee: 'Panne signalée',
    en_panne: 'En panne',
    hors_service: 'Hors service',
    en_maintenance: 'En maintenance',
    en_stock: 'En stock',
    reforme: 'Réformé',
  }
  const color = colors[status] || 'bg-slate-400'
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 rounded-full shadow-md ${color} animate-pulse`} />
      <span className="text-xs text-slate-500">{labels[status] || status}</span>
    </span>
  )
}

// ---- COMPOSANT CARTE UTILISATEUR ----
function UserCard({ user }: { user: any }) {
  const assets = user.assets || []
  const ordinateurs = assets.filter((a: any) => a.type?.toLowerCase().includes('ordinateur'))
  const imprimantes = assets.filter((a: any) => a.type?.toLowerCase().includes('imprimante'))
  const autres = assets.filter((a: any) =>
    !a.type?.toLowerCase().includes('ordinateur') &&
    !a.type?.toLowerCase().includes('imprimante')
  )

  return (
    <Card className="hover:shadow-md transition-shadow border border-slate-200">
      <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">
              {user.full_name || user.email}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
            {(user.full_name || user.email || '?')[0].toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-3">

        {/* Département / Service */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 rounded-md p-2">
            <p className="text-slate-400 mb-0.5">Département</p>
            <p className="font-medium text-slate-700">{user.department?.name || '—'}</p>
          </div>
          <div className="bg-slate-50 rounded-md p-2">
            <p className="text-slate-400 mb-0.5">Service</p>
            <p className="font-medium text-slate-700">{user.service?.name || '—'}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="text-xs bg-slate-50 rounded-md p-2">
          <p className="text-slate-400 mb-0.5">Contact</p>
          <p className="font-medium text-slate-700">{user.phone || '—'}</p>
        </div>

        {/* Ordinateurs */}
        {ordinateurs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Monitor size={12} /> Ordinateurs
            </p>
            {ordinateurs.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-md px-2 py-1.5">
                <span className="text-xs text-slate-700">{a.reference} — {a.brand} {a.model}</span>
                <Led status={a.status} />
              </div>
            ))}
          </div>
        )}

        {/* Imprimantes */}
        {imprimantes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Printer size={12} /> Imprimantes
            </p>
            {imprimantes.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-md px-2 py-1.5">
                <span className="text-xs text-slate-700">{a.reference} — {a.brand} {a.model}</span>
                <Led status={a.status} />
              </div>
            ))}
          </div>
        )}

        {/* Autres outils */}
        {autres.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Wifi size={12} /> Autres outils
            </p>
            {autres.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-md px-2 py-1.5">
                <span className="text-xs text-slate-700">{a.type} — {a.reference}</span>
                <Led status={a.status} />
              </div>
            ))}
          </div>
        )}

        {assets.length === 0 && (
          <p className="text-xs text-slate-400 italic">Aucun équipement affecté</p>
        )}

      </CardContent>
    </Card>
  )
}

// ============================================================
// DASHBOARD PRINCIPAL
// ============================================================
export default function Dashboard() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    totalUsers: 0,
  })
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (['admin_it', 'adjoint_it', 'admin_principal'].includes(profile?.role || '')) {
      fetchUsersWithAssets()
    } else if (profile?.role === 'dg') {
      fetchStats()
    } else {
      fetchMyData()
    }
  }, [profile])

  // ---- FETCH USERS AVEC ASSETS (vue IT) ----
  async function fetchUsersWithAssets() {
    try {
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*, department:department_id(name), service:service_id(name)')
        .eq('is_active', true)
        .eq('role', 'employe')
        .order('full_name')

      if (!usersData) return

      const usersWithAssets = await Promise.all(
        usersData.map(async (user) => {
          const { data: assets } = await supabase
            .from('assets')
            .select('id, reference, type, brand, model, status')
            .eq('assigned_to', user.id)
          return { ...user, assets: assets || [] }
        })
      )

      setUsers(usersWithAssets)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ---- FETCH STATS (vue DG) ----
  async function fetchStats() {
    try {
      const [assets, tickets, openT, resolvedT, users, recentT] = await Promise.all([
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'ouvert'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolu'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      setStats({
        totalAssets: assets.count || 0,
        totalTickets: tickets.count || 0,
        openTickets: openT.count || 0,
        resolvedTickets: resolvedT.count || 0,
        totalUsers: users.count || 0,
      })
      setRecentTickets(recentT.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ---- FETCH MES DONNÉES (vue employé) ----
  async function fetchMyData() {
    try {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('requester_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentTickets(tickets || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'ouvert': return 'bg-blue-100 text-blue-700'
      case 'en_cours': return 'bg-yellow-100 text-yellow-700'
      case 'resolu': return 'bg-green-100 text-green-700'
      case 'clos': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const filteredUsers = users.filter(u =>
    (u.full_name || u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.department?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400">Chargement...</p>
    </div>
  )

  // ============================================================
  // VUE IT : cartes utilisateurs avec équipements + LED
  // ============================================================
  if (['admin_it', 'adjoint_it', 'admin_principal'].includes(profile?.role || '')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Parc Informatique</h1>
            <p className="text-slate-500 text-sm mt-1">{users.length} utilisateur(s) avec équipements</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Légende LED */}
            <div className="flex items-center gap-3 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> OK</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Signalée</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> En panne</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600" /> Hors service</span>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <input
          type="text"
          placeholder="Rechercher un utilisateur ou département..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
        />

        {/* Cartes utilisateurs */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ============================================================
  // VUE DG : statistiques globales
  // ============================================================
  if (profile?.role === 'dg') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord — Direction Générale</h1>
          <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm text-slate-500">Équipements</CardTitle><Monitor size={18} className="text-slate-400" /></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalAssets}</p></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm text-slate-500">Total tickets</CardTitle><Ticket size={18} className="text-slate-400" /></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalTickets}</p></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm text-slate-500">Ouverts</CardTitle><AlertTriangle size={18} className="text-blue-400" /></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{stats.openTickets}</p></CardContent></Card>
          <Card><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm text-slate-500">Résolus</CardTitle><CheckCircle size={18} className="text-green-400" /></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{stats.resolvedTickets}</p></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Tickets récents</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentTickets.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-slate-400">{t.ticket_number} — {new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(t.status)}`}>{t.status.replace('_', ' ')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // VUE EMPLOYÉ : mes tickets récents
  // ============================================================
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Bonjour, {profile?.full_name || profile?.email} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Mes demandes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{recentTickets.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">En cours</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-yellow-600">{recentTickets.filter(t => t.status === 'en_cours').length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Résolus</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{recentTickets.filter(t => t.status === 'resolu').length}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Mes dernières demandes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recentTickets.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune demande pour le moment</p>
          ) : (
            recentTickets.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-slate-400">{t.ticket_number} — {new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(t.status)}`}>{t.status.replace('_', ' ')}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
