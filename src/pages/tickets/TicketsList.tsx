import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Plus, Eye } from 'lucide-react'

export default function TicketsList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  useEffect(() => { fetchTickets() }, [profile])

  async function fetchTickets() {
    try {
      let query = supabase
        .from('tickets')
        .select('*, requester:requester_id(full_name, email), assigned:assigned_to(full_name)')
        .order('created_at', { ascending: false })
      if (profile?.role === 'employe') query = query.eq('requester_id', profile.id)
      else if (profile?.role === 'adjoint_it') query = query.eq('assigned_to', profile.id)
      const { data, error } = await query
      if (error) throw error
      setTickets(data || [])
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
      case 'en_attente': return 'bg-orange-100 text-orange-700'
      case 'resolu': return 'bg-green-100 text-green-700'
      case 'clos': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgente': return 'bg-red-100 text-red-700'
      case 'haute': return 'bg-orange-100 text-orange-700'
      case 'normale': return 'bg-blue-100 text-blue-700'
      case 'basse': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  // ---- VUE DÉTAIL ----
  if (selectedTicketId) {
    return <TicketDetailInline
      ticketId={selectedTicketId}
      profile={profile}
      onBack={() => { setSelectedTicketId(null); fetchTickets() }}
    />
  }

  // ---- VUE FORMULAIRE ----
  if (selectedTicketId === '') {
    return <TicketFormInline
      profile={profile}
      onBack={() => { setSelectedTicketId(null); fetchTickets() }}
    />
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {profile?.role === 'employe' ? 'Mes demandes' : 'Tickets'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{tickets.length} ticket(s)</p>
        </div>
        {['employe', 'admin_principal', 'admin_it'].includes(profile?.role || '') && (
          <Button onClick={() => setSelectedTicketId('')} className="flex items-center gap-2">
            <Plus size={16} />
            Nouvelle demande
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Aucun ticket</p>
              {profile?.role === 'employe' && (
                <Button className="mt-4" onClick={() => setSelectedTicketId('')}>
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
                    {profile?.role !== 'employe' && <th className="text-left px-4 py-3 font-medium text-slate-600">Demandeur</th>}
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Priorité</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{ticket.ticket_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{ticket.subject}</td>
                      {profile?.role !== 'employe' && (
                        <td className="px-4 py-3 text-slate-600">{ticket.requester?.full_name || ticket.requester?.email || '—'}</td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(ticket.status)}`}>{ticket.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(ticket.id)} className="flex items-center gap-1">
                          <Eye size={14} /> Voir
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

// ============================================================
// FORMULAIRE NOUVEAU TICKET - INLINE (pas de route séparée)
// ============================================================
function TicketFormInline({ profile, onBack }: { profile: any, onBack: () => void }) {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normale')
  const [assetId, setAssetId] = useState('')

  useEffect(() => {
    supabase.from('assets').select('id, reference, type, brand, model')
      .then(({ data }) => setAssets(data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('tickets').insert({
        ticket_number: `TCK-${Date.now()}`,
        requester_id: profile?.id,
        subject,
        description,
        priority,
        asset_id: assetId || null,
        status: 'ouvert',
      })
      if (error) throw error
      onBack()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
        <h1 className="text-2xl font-bold text-slate-800">Nouvelle demande</h1>
      </div>
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Objet *</label>
              <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Ex: Mon ordinateur ne démarre plus" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <textarea className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" rows={4} value={description} onChange={e => setDescription(e.target.value)} required placeholder="Décrivez le problème..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="basse">🟢 Basse</option>
                <option value="normale">🔵 Normale</option>
                <option value="haute">🟠 Haute</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Équipement (optionnel)</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white" value={assetId} onChange={e => setAssetId(e.target.value)}>
                <option value="">-- Aucun --</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.reference} — {a.brand} {a.model}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer'}</Button>
              <Button type="button" variant="outline" onClick={onBack}>Annuler</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// DÉTAIL TICKET - INLINE (pas de route séparée)
// ============================================================
function TicketDetailInline({ ticketId, profile, onBack }: { ticketId: string, profile: any, onBack: () => void }) {
  const [ticket, setTicket] = useState<any>(null)
  const [techniciens, setTechniciens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resolution, setResolution] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    fetchTicket()
    if (['admin_it', 'admin_principal'].includes(profile?.role)) fetchTechniciens()
  }, [ticketId])

  async function fetchTicket() {
    try {
      const { data } = await supabase
        .from('tickets')
        .select('*, requester:requester_id(full_name, email), assigned:assigned_to(full_name, email), asset:asset_id(reference, brand, model)')
        .eq('id', ticketId)
        .maybeSingle()
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
    const { data } = await supabase.from('profiles').select('id, full_name, email').in('role', ['adjoint_it', 'admin_it'])
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
      await supabase.from('tickets').update(updates).eq('id', ticketId)
      await supabase.from('ticket_status_history').insert({
        ticket_id: ticketId,
        old_status: ticket.status,
        new_status: selectedStatus,
        changed_by: profile?.id,
        note: resolution || null,
      })
      await fetchTicket()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      await supabase.from('tickets').update({
        confirmed_by_user: true,
        confirmed_at: new Date().toISOString(),
        status: 'clos',
        closed_at: new Date().toISOString(),
      }).eq('id', ticketId)
      await fetchTicket()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'ouvert': return 'bg-blue-100 text-blue-700'
      case 'en_cours': return 'bg-yellow-100 text-yellow-700'
      case 'en_attente': return 'bg-orange-100 text-orange-700'
      case 'resolu': return 'bg-green-100 text-green-700'
      case 'clos': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>
  if (!ticket) return <div><Button variant="ghost" onClick={onBack}>← Retour</Button><p>Ticket introuvable</p></div>

  const isIT = ['admin_principal', 'admin_it', 'adjoint_it'].includes(profile?.role || '')
  const isOwner = profile?.id === ticket.requester_id
  const canConfirm = isOwner && ticket.status === 'resolu' && !ticket.confirmed_by_user

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{ticket.subject}</h1>
          <p className="text-slate-500 text-sm">{ticket.ticket_number}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(ticket.status)}`}>
          {ticket.status.replace('_', ' ')}
        </span>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-slate-500">Demandeur</p><p className="font-medium">{ticket.requester?.full_name || ticket.requester?.email}</p></div>
            <div><p className="text-slate-500">Date</p><p className="font-medium">{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</p></div>
            <div><p className="text-slate-500">Technicien</p><p className="font-medium">{ticket.assigned?.full_name || '—'}</p></div>
            <div><p className="text-slate-500">Équipement</p><p className="font-medium">{ticket.asset ? `${ticket.asset.reference} — ${ticket.asset.brand} ${ticket.asset.model}` : '—'}</p></div>
          </div>
          <div><p className="text-slate-500 text-sm mb-1">Description</p><p className="bg-slate-50 p-3 rounded-md text-sm">{ticket.description}</p></div>
          {ticket.resolution && <div><p className="text-slate-500 text-sm mb-1">Résolution</p><p className="bg-green-50 p-3 rounded-md text-sm">{ticket.resolution}</p></div>}
          {ticket.confirmed_by_user && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm">✅ Résolution confirmée</p>}
        </CardContent>
      </Card>

      {isIT && ticket.status !== 'clos' && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h3 className="font-semibold text-slate-800">Actions technicien</h3>
            {['admin_it', 'admin_principal'].includes(profile?.role) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigner à</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white" value={selectedTech} onChange={e => setSelectedTech(e.target.value)}>
                  <option value="">-- Choisir --</option>
                  {techniciens.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                <option value="ouvert">Ouvert</option>
                <option value="en_cours">En cours</option>
                <option value="en_attente">En attente</option>
                <option value="resolu">Résolu</option>
                <option value="clos">Clos</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Résolution</label>
              <textarea className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" rows={3} value={resolution} onChange={e => setResolution(e.target.value)} />
            </div>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </CardContent>
        </Card>
      )}

      {canConfirm && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">Problème résolu ?</p>
              <p className="text-sm text-green-600">Confirmez la résolution</p>
            </div>
            <Button onClick={handleConfirm} disabled={saving} className="bg-green-600 hover:bg-green-700">
              ✅ Confirmer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
