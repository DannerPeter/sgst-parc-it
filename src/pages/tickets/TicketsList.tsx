import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Plus, Eye } from 'lucide-react'

export default function TicketsList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [profile])

  async function fetchTickets() {
    try {
      let query = supabase
        .from('tickets')
        .select('*, requester:requester_id(full_name, email), assigned:assigned_to(full_name)')
        .order('created_at', { ascending: false })

      if (profile?.role === 'employe') {
        query = query.eq('requester_id', profile.id)
      } else if (profile?.role === 'adjoint_it') {
        query = query.eq('assigned_to', profile.id)
      }

      const { data, error } = await query
      if (error) throw error
      setTickets(data || [])
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {profile?.role === 'employe' ? 'Mes demandes' : 'Tickets'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{tickets.length} ticket(s) trouvé(s)</p>
        </div>
        {(profile?.role === 'employe' || profile?.role === 'admin_principal' || profile?.role === 'admin_it') && (
          <Button onClick={() => navigate('/tickets/new')} className="flex items-center gap-2">
            <Plus size={16} />
            Nouvelle demande
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Aucun ticket pour le moment</p>
              {profile?.role === 'employe' && (
                <Button className="mt-4" onClick={() => navigate('/tickets/new')}>
                  Créer ma première demande
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">N° Ticket</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Objet</th>
                    {profile?.role !== 'employe' && (
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Demandeur</th>
                    )}
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Priorité</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{ticket.ticket_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">{ticket.subject}</td>
                      {profile?.role !== 'employe' && (
                        <td className="px-4 py-3 text-slate-600">
                          {ticket.requester?.full_name || ticket.requester?.email || '—'}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
