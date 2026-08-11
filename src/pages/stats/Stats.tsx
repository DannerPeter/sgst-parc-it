import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Monitor, Ticket, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export default function Stats() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    assetsEnService: 0,
    assetsEnPanne: 0,
    assetsEnMaintenance: 0,
    totalTickets: 0,
    ticketsOuverts: 0,
    ticketsEnCours: 0,
    ticketsResolus: 0,
    ticketsClos: 0,
    totalUsers: 0,
    usersActifs: 0,
  })
  const [ticketsByPriority, setTicketsByPriority] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const [
        totalAssets,
        assetsEnService,
        assetsEnPanne,
        assetsEnMaintenance,
        totalTickets,
        ticketsOuverts,
        ticketsEnCours,
        ticketsResolus,
        ticketsClos,
        totalUsers,
        usersActifs,
        ticketsUrgents,
        ticketsHauts,
        ticketsNormaux,
        ticketsBas,
      ] = await Promise.all([
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'en_service'),
        supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'en_panne'),
        supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'en_maintenance'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'ouvert'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'en_cours'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolu'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'clos'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'urgente'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'haute'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'normale'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('priority', 'basse'),
      ])

      setStats({
        totalAssets: totalAssets.count || 0,
        assetsEnService: assetsEnService.count || 0,
        assetsEnPanne: assetsEnPanne.count || 0,
        assetsEnMaintenance: assetsEnMaintenance.count || 0,
        totalTickets: totalTickets.count || 0,
        ticketsOuverts: ticketsOuverts.count || 0,
        ticketsEnCours: ticketsEnCours.count || 0,
        ticketsResolus: ticketsResolus.count || 0,
        ticketsClos: ticketsClos.count || 0,
        totalUsers: totalUsers.count || 0,
        usersActifs: usersActifs.count || 0,
      })

      setTicketsByPriority([
        { label: 'Urgente', count: ticketsUrgents.count || 0, color: 'bg-red-500' },
        { label: 'Haute', count: ticketsHauts.count || 0, color: 'bg-orange-500' },
        { label: 'Normale', count: ticketsNormaux.count || 0, color: 'bg-blue-500' },
        { label: 'Basse', count: ticketsBas.count || 0, color: 'bg-slate-400' },
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  const tauxResolution = stats.totalTickets > 0
    ? Math.round(((stats.ticketsResolus + stats.ticketsClos) / stats.totalTickets) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Statistiques</h1>
        <p className="text-slate-500 text-sm mt-1">Vue globale du parc informatique</p>
      </div>

      {/* Parc informatique */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Parc informatique</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total équipements</CardTitle>
              <Monitor size={18} className="text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{stats.totalAssets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">En service</CardTitle>
              <CheckCircle size={18} className="text-green-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.assetsEnService}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">En panne</CardTitle>
              <AlertTriangle size={18} className="text-red-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.assetsEnPanne}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">En maintenance</CardTitle>
              <Clock size={18} className="text-yellow-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.assetsEnMaintenance}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tickets */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Support IT</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total tickets</CardTitle>
              <Ticket size={18} className="text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{stats.totalTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Ouverts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.ticketsOuverts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.ticketsEnCours}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Résolus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.ticketsResolus}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Taux résolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{tauxResolution}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tickets par priorité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets par priorité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketsByPriority.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-slate-800">{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: stats.totalTickets > 0 ? `${(item.count / stats.totalTickets) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Total utilisateurs</p>
                  <p className="text-xs text-slate-400">Tous rôles confondus</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users size={18} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Utilisateurs actifs</p>
                  <p className="text-xs text-slate-400">Comptes activés</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.usersActifs}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
