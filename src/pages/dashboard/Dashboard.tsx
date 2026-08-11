import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Monitor, Ticket, Users, CheckCircle } from 'lucide-react'

interface Stats {
  totalAssets: number
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  totalUsers: number
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalAssets: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    totalUsers: 0,
  })
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [profile])

  async function fetchStats() {
    try {
      if (profile?.role === 'employe') {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('requester_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5)

        const { count: total } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('requester_id', profile.id)

        const { count: open } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('requester_id', profile.id)
          .eq('status', 'ouvert')

        const { count: resolved } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('requester_id', profile.id)
          .eq('status', 'resolu')

        setStats(s => ({ ...s, totalTickets: total || 0, openTickets: open || 0, resolvedTickets: resolved || 0 }))
        setRecentTickets(tickets || [])
      } else {
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
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'ouvert': return 'bg-blue-100 text-blue-700'
      case 'en_cours': return 'bg-yellow-100 text-yellow-700'
      case 'en_attente': return 'bg-orange-100 text-orange-700'
      case 'resolu': return 'bg-green-100 text-green-700'
      case 'clos': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-700'
      case 'haute': return 'bg-orange-100 text-orange-700'
      case 'normale': return 'bg-blue-100 text-blue-700'
      case 'basse': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Bonjour, {profile?.full_name || profile?.email} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {profile?.role !== 'employe' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Équipements</CardTitle>
              <Monitor size={18} className="text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{stats.totalAssets}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              {profile?.role === 'employe' ? 'Mes demandes' : 'Total tickets'}
            </CardTitle>
            <Ticket size={18} className="text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-800">{stats.totalTickets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ouverts</CardTitle>
            <Ticket size={18} className="text-blue-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.openTickets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Résolus</CardTitle>
            <CheckCircle size={18} className="text-green-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.resolvedTickets}</p>
          </CardContent>
        </Card>

        {profile?.role !== 'employe' && profile?.role !== 'dg' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Utilisateurs</CardTitle>
              <Users size={18} className="text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-800">{stats.totalUsers}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tickets récents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {profile?.role === 'employe' ? 'Mes dernières demandes' : 'Tickets récents'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucun ticket pour le moment</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{ticket.subject}</p>
                    <p className="text-xs text-slate-400">
                      {ticket.ticket_number} — {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

