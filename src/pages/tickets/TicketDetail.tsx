import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function TicketDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<any>(null)
  const [techniciens, setTechniciens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resolution, setResolution] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    // ---- PROTECTION : si pas d'id valide, retour à la liste ----
    if (!id || id === 'new') {
      navigate('/tickets')
      return
    }
    fetchTicket()
    if (profile?.role === 'admin_it' || profile?.role === 'admin_principal') {
      fetchTechniciens()
    }
  }, [id, profile])

  async function fetchTicket() {
    // ---- PROTECTION SUPPLÉMENTAIRE ----
    if (!id || id === 'new') return
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, requester:requester_id(full_name, email), assigned:assigned_to(full_name, email), asset:asset_id(reference, type, brand, model)')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      setTicket(data)
      setResolution(data?.resolution || '')
      setSelectedTech(data?.assigned_to || '')
      setSelectedStatus(data?.status || 'ouvert')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  async function fetchTechniciens() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('role', ['adjoint_it', 'admin_it'])
    setTechniciens(data || [])
  }

  async function handleUpdate() {
    setSaving(true)
    try {
      const updates: any = { status: selectedStatus }
      if (selectedTech) updates.assigned_to = selectedTech
      if (resolution) updates.resolution = resolution
      if (selectedStatus === 'resolu') updates.resolved_at = new Date().toISOString()
      if (selectedStatus === 'clos') updates.closed_at = new Date().toISOString()

      const { error } = await supabase.from('tickets').update(updates).eq('id', id)
      if (error) throw error

      await supabase.from('ticket_status_history').insert({
        ticket_id: id,
        old_status: ticket.status,
        new_status: selectedStatus,
        changed_by: profile?.id,
        note: resolution || null,
      })

      await fetchTicket()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmResolution() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          confirmed_by_user: true,
          confirmed_at: new Date().toISOString(),
          status: 'clos',
          closed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
      await fetchTicket()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
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
  if (!ticket) return <p className="text-slate-500">Ticket introuvable</p>

  const isIT = ['admin_principal', 'admin_it', 'adjoint_it'].includes(profile?.role || '')
  const isOwner = profile?.id === ticket.requester_id
  const canConfirm = isOwner && ticket.status === 'resolu' && !ticket.confirmed_by_user

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{ticket.subject}</h1>
          <p className="text-slate-500 text-sm">{ticket.ticket_number}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${priorityColor(ticket.priority)}`}>
            {ticket.priority}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(ticket.status)}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détails de la demande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Demandeur</p>
              <p className="font-medium">{ticket.requester?.full_name || ticket.requester?.email}</p>
            </div>
            <div>
              <p className="text-slate-500">Date de création</p>
              <p className="font-medium">{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-slate-500">Technicien assigné</p>
              <p className="font-medium">{ticket.assigned?.full_name || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Équipement</p>
              <p className="font-medium">
                {ticket.asset
                  ? `${ticket.asset.reference} — ${ticket.asset.brand} ${ticket.asset.model}`
                  : '—'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-slate-500 text-sm mb-1">Description</p>
            <p className="text-slate-800 bg-slate-50 p-3 rounded-md text-sm">{ticket.description}</p>
          </div>

          {ticket.resolution && (
            <div>
              <p className="text-slate-500 text-sm mb-1">Résolution</p>
              <p className="text-slate-800 bg-green-50 p-3 rounded-md text-sm">{ticket.resolution}</p>
            </div>
          )}

          {ticket.confirmed_by_user && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle size={16} />
              <p className="text-sm font-medium">Résolution confirmée par le demandeur</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isIT && ticket.status !== 'clos' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions technicien</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(profile?.role === 'admin_it' || profile?.role === 'admin_principal') && (
              <div className="space-y-2">
                <Label>Assigner à un technicien</Label>
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">-- Choisir un technicien --</option>
                  {techniciens.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name || t.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Statut</Label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="ouvert">Ouvert</option>
                <option value="en_cours">En cours</option>
                <option value="en_attente">En attente</option>
                <option value="resolu">Résolu</option>
                <option value="clos">Clos</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Note / Résolution</Label>
              <Textarea
                placeholder="Décrivez la solution apportée..."
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>

            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </CardContent>
        </Card>
      )}

      {canConfirm && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">Votre problème a été résolu</p>
                <p className="text-sm text-green-600">Confirmez-vous que le problème est bien résolu ?</p>
              </div>
              <Button
                onClick={handleConfirmResolution}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={16} className="mr-2" />
                Confirmer la résolution
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
