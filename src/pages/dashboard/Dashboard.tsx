// ============================================================
// DASHBOARD.TSX - SGST GESTION PARC INFORMATIQUE
// Vue IT : cartes utilisateurs + LED
// Vue DG : statistiques globales
// Vue Employé : mes tickets
// ============================================================

import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Monitor, Ticket, Users, CheckCircle, AlertTriangle, Clock, Printer, Wifi } from 'lucide-react'
import { previewPrint } from '../../lib/print'

// ============================================================
// COMPOSANT LED
// ============================================================
function Led({ status }: { status: string }) {
  const colors: Record<string, string> = {
    en_service: 'bg-green-500',
    en_panne_signalee: 'bg-orange-500',
    en_panne: 'bg-yellow-400',
    hors_service: 'bg-red-600',
    en_maintenance: 'bg-yellow-400',
    en_stock: 'bg-slate-400',
    reforme: 'bg-red-600',
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
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-slate-400'} animate-pulse`} />
      <span className="text-xs text-muted-foreground">{labels[status] || status}</span>
    </span>
  )
}

// ============================================================
// CARTE UTILISATEUR
// ============================================================
function UserCard({ user }: { user: any }) {
  const assets = user.assets || []
  const ordinateurs = assets.filter((a: any) => a.type?.toLowerCase().includes('ordinateur'))
  const imprimantes = assets.filter((a: any) => a.type?.toLowerCase().includes('imprimante'))
  const autres = assets.filter((a: any) =>
    !a.type?.toLowerCase().includes('ordinateur') &&
    !a.type?.toLowerCase().includes('imprimante')
  )

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 bg-muted rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {user.full_name || user.email}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
            {(user.full_name || user.email || '?')[0].toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-3">

        {/* Département / Service */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted rounded-md p-2">
            <p className="text-muted-foreground mb-0.5">Département</p>
            <p className="font-medium">{user.department?.name || '—'}</p>
          </div>
          <div className="bg-muted rounded-md p-2">
            <p className="text-muted-foreground mb-0.5">Service</p>
            <p className="font-medium">{user.service?.name || '—'}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="text-xs bg-muted rounded-md p-2">
          <p className="text-muted-foreground mb-0.5">Contact</p>
          <p className="font-medium">{user.phone || '—'}</p>
        </div>

        {/* Ordinateurs */}
        {ordinateurs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Monitor size={12} /> Ordinateurs
            </p>
            {ordinateurs.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-background border border-border rounded-md px-2 py-1.5">
                <span className="text-xs">{a.reference} — {a.brand} {a.model}</span>
                <Led status={a.status} />
              </div>
            ))}
          </div>
        )}

        {/* Imprimantes */}
        {imprimantes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Printer size={12} /> Imprimantes
            </p>
            {imprimantes.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-background border border-border rounded-md px-2 py-1.5">
                <span className="text-xs">{a.reference} — {a.brand} {a.model}</span>
                <Led status={a.status} />
              </div>
            ))}
          </div>
        )}

        {/* Autres */}
        {autres.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Wifi size={12} /> Autres outils
            </p>
            {autres.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-background border border-border rounded-md px-2 py-1.5">
                <span className="text-xs">{a.type} — {a.reference}</span>
                <Led status={a.status} />
              </div>
            ))}
          </div>
        )}

        {assets.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Aucun équipement affecté</p>
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
    assetsEnPanne: 0,
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

  async function fetchUsersWithAssets() {
    try {
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*, department:department_id(name), service:service_id(name)')
        .eq('is_active', true)
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

  async function fetchStats() {
    try {
      const [assets, tickets, openT, resolvedT, users, enPanne, recentT] = await Promise.all([
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'ouvert'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolu'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'en_panne'),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      setStats({
        totalAssets: assets.count || 0,
        totalTickets: tickets.count || 0,
        openTickets: openT.count || 0,
        resolvedTickets: resolvedT.count || 0,
        totalUsers: users.count || 0,
        assetsEnPanne: enPanne.count || 0,
      })
      setRecentTickets(recentT.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyData() {
    try {
      if (!profile?.id) return
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentTickets(data || [])
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
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  )

  // ============================================================
  // VUE IT
  // ============================================================
  if (['admin_it', 'adjoint_it', 'admin_principal'].includes(profile?.role || '')) {
    return (
      <div id="dashboard-content" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Parc Informatique</h1>
            <p className="text-muted-foreground text-sm mt-1">{users.length} utilisateur(s)</p>
          </div>
          <div className="flex items-center gap-3">
            {/* LÉGENDE LED */}
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> OK</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Signalée</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> En panne</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600" /> Hors service</span>
            </div>
            <Button variant="outline" onClick={() => previewPrint('dashboard-content')} className="flex items-center gap-2">
              <Printer size={16} /> Aperçu PDF
            </Button>
          </div>
        </div>

        {/* BARRE RECHERCHE */}
        <input
          type="text"
          placeholder="Rechercher un utilisateur ou département..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-input rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* CARTES */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
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
  // VUE DG
  // ============================================================
  if (profile?.role === 'dg') {
    return (
      <div id="dashboard-dg-content" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Direction Générale</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button variant="outline" onClick={() => previewPrint('dashboard-dg-content')} className="flex items-center gap-2">
            <Printer size={16} /> Aperçu PDF
          </Button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Équipements</CardTitle>
              <Monitor size={18} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalAssets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">En panne</CardTitle>
              <AlertTriangle size={18} className="text-red-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.assetsEnPanne}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Utilisateurs</CardTitle>
              <Users size={18} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total tickets</CardTitle>
              <Ticket size={18} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tickets ouverts</CardTitle>
              <Clock size={18} className="text-blue-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.openTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tickets résolus</CardTitle>
              <CheckCircle size={18} className="text-green-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.resolvedTickets}</p>
            </CardContent>
          </Card>
        </div>

        {/* TICKETS RÉCENTS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets récents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTickets.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun ticket</p>
            ) : (
              recentTickets.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{t.ticket_number} — {new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(t.status)}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // VUE EMPLOYÉ
  // ============================================================
  return (
    <div id="dashboard-employe-content" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Bonjour, {profile?.full_name || profile?.email} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" onClick={() => previewPrint('dashboard-employe-content')} className="flex items-center gap-2">
          <Printer size={16} /> Aperçu PDF
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Mes demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{recentTickets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{recentTickets.filter(t => t.status === 'en_cours').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Résolus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{recentTickets.filter(t => t.status === 'resolu').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* DERNIÈRES DEMANDES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mes dernières demandes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTickets.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune demande pour le moment</p>
          ) : (
            recentTickets.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">{t.ticket_number} — {new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(t.status)}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
