// ============================================================
// TICKETSLIST.TSX - SGST GESTION PARC INFORMATIQUE
// Liste + Nouveau ticket + Détail — tout inline, zéro route séparée
// ============================================================

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Plus, Eye, Printer } from 'lucide-react'

type View = 'list' | 'new' | 'detail'

export default function TicketsList() {
  const { profile } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  function goBack() {
    setView('list')
    setSelectedId(null)
    fetchTickets()
  }

  if (view === 'new') return <TicketForm profile={profile} onBack={goBack} />
  if (view === 'detail' && selectedId) return <TicketDetail ticketId={selectedId} profile={profile} onBack={goBack} />

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer size={16} /> Imprimer
          </Button>
          {['employe', 'admin_principal', 'admin_it'].includes(profile?.role || '') && (
            <Button onClick={() => setView('new')} className="flex items-center gap-2">
              <Plus size={16} /> Nouvelle demande
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 mb-4">Aucun ticket pour le moment</p>
              {['employe', 'admin_principal', 'admin_it'].includes(profile?.role || '') && (
                <Button onClick={() => setView('new')}>
                  <Plus size={16} className="mr-2" /> Créer une demande
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
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
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
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedId(ticket.id); setView('detail') }} className="flex items-center gap-1">
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
// FORMULAIRE NOUVEAU TICKET
// ============================================================
function TicketForm({ profile, onBack }: { profile: any, onBack: () => void }) {
  const [assets, setAssets] = useState<any[]>([])
  const [department, setDepartment] = useState<any>(null)
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normale')
  const [checkedAssets, setCheckedAssets] = useState<string[]>([])
  const [isSoftware, setIsSoftware] = useState(false)
  const [softwareName, setSoftwareName] = useState('')

  useEffect(() => {
    fetchMyAssets()
    fetchDeptService()
  }, [])

  async function fetchMyAssets() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('assets')
      .select('id, reference, type, brand, model, status')
      .eq('assigned_to', profile.id)
    setAssets(data || [])
  }

  async function fetchDeptService() {
    if (profile?.department_id) {
      const { data } = await supabase.from('departments').select('name').eq('id', profile.department_id).maybeSingle()
      setDepartment(data)
    }
    if (profile?.service_id) {
      const { data } = await supabase.from('services').select('name').eq('id', profile.service_id).maybeSingle()
      setService(data)
    }
  }

  function toggleAsset(id: string) {
    setCheckedAssets(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let fullDesc = description
      if (checkedAssets.length > 0) {
        const names = assets.filter(a => checkedAssets.includes(a.id)).map(a => `${a.reference} (${a.type})`).join(', ')
        fullDesc += `\n\nMatériels défaillants: ${names}`
      }
      if (isSoftware && softwareName) fullDesc += `\n\nLogiciel concerné: ${softwareName}`

      const { error } = await supabase.from('tickets').insert({
        ticket_number: `TCK-${Date.now()}`,
        requester_id: profile?.id,
        subject,
        description: fullDesc,
        priority,
        asset_id: checkedAssets[0] || null,
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nouvelle demande</h1>
            <p className="text-slate-500 text-sm">Remplissez les informations ci-dessous</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
          <Printer size={16} /> Aperçu impression
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* SECTION 1 : IDENTIFIANT */}
        <Card>
          <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Section 1 — Identifiant du demandeur
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-400 text-xs mb-1">Nom complet</p><p className="font-medium bg-slate-50 px-3 py-2 rounded-md">{profile?.full_name || '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Email</p><p className="font-medium bg-slate-50 px-3 py-2 rounded-md">{profile?.email || '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Département</p><p className="font-medium bg-slate-50 px-3 py-2 rounded-md">{department?.name || '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Service</p><p className="font-medium bg-slate-50 px-3 py-2 rounded-md">{service?.name || '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Téléphone</p><p className="font-medium bg-slate-50 px-3 py-2 rounded-md">{profile?.phone || '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Matricule</p><p className="font-medium bg-slate-50 px-3 py-2 rounded-md">{profile?.matricule || '—'}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2 : DESCRIPTION */}
        <Card>
          <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Section 2 — Description du besoin
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Objet *</label>
              <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Ex: Mon ordinateur ne démarre plus" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description détaillée *</label>
              <textarea className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" rows={4} placeholder="Décrivez le problème..." value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Priorité</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="basse">🟢 Basse</option>
                <option value="normale">🔵 Normale</option>
                <option value="haute">🟠 Haute</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 : MATÉRIEL */}
        <Card>
          <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Section 3 — Matériel concerné
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {assets.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Cochez le(s) matériel(s) défaillant(s)</label>
                {assets.map(asset => (
                  <label key={asset.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={checkedAssets.includes(asset.id)} onChange={() => toggleAsset(asset.id)} className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{asset.reference} — {asset.brand} {asset.model}</p>
                      <p className="text-xs text-slate-400">{asset.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${asset.status === 'en_service' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Aucun équipement affecté à votre compte</p>
            )}

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isSoftware} onChange={e => setIsSoftware(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm font-medium text-slate-700">Le problème concerne un logiciel</span>
              </label>
              {isSoftware && (
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Nom du logiciel (ex: SAP, Excel...)" value={softwareName} onChange={e => setSoftwareName(e.target.value)} />
              )}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer la demande'}</Button>
          <Button type="button" variant="outline" onClick={onBack}>Annuler</Button>
        </div>
      </form>
    </div>
  )
}

// ============================================================
// DÉTAIL TICKET
// ============================================================
function TicketDetail({ ticketId, profile, onBack }: { ticketId: string, profile: any, onBack: () => void }) {
  const [ticket, setTicket] = useState<any>(null)
  const [techniciens, setTechniciens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resolution, setResolution] = useState('')
  const [diagnostic, setDiagnostic] = useState('')
  const [duration, setDuration] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    fetchTicket()
    if (['admin_it', 'admin_principal', 'adjoint_it'].includes(profile?.role)) fetchTechniciens()
  }, [ticketId])

  async function fetchTicket() {
    try {
      const { data } = await supabase
        .from('tickets')
        .select('*, requester:requester_id(full_name, email, phone, matricule), assigned:assigned_to(full_name, email), asset:asset_id(reference, brand, model, type)')
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

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ticket.subject}</h1>
            <p className="text-slate-500 text-sm">{ticket.ticket_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(ticket.status)}`}>
            {ticket.status.replace('_', ' ')}
          </span>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-1">
            <Printer size={14} /> Imprimer
          </Button>
        </div>
      </div>

      {/* PARTIE 1 : DEMANDE */}
      <Card>
        <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
          <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Partie 1 — Détails de la demande
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-slate-400 text-xs mb-1">Demandeur</p><p className="font-medium">{ticket.requester?.full_name || '—'}</p></div>
            <div><p className="text-slate-400 text-xs mb-1">Email</p><p className="font-medium">{ticket.requester?.email || '—'}</p></div>
            <div><p className="text-slate-400 text-xs mb-1">Téléphone</p><p className="font-medium">{ticket.requester?.phone || '—'}</p></div>
            <div><p className="text-slate-400 text-xs mb-1">Date</p><p className="font-medium">{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</p></div>
            <div><p className="text-slate-400 text-xs mb-1">Équipement</p><p className="font-medium">{ticket.asset ? `${ticket.asset.reference} — ${ticket.asset.brand} ${ticket.asset.model}` : '—'}</p></div>
            <div><p className="text-slate-400 text-xs mb-1">Technicien assigné</p><p className="font-medium">{ticket.assigned?.full_name || '—'}</p></div>
          </div>
          <div><p className="text-slate-400 text-xs mb-1">Description</p><p className="bg-slate-50 p-3 rounded-md text-sm whitespace-pre-line">{ticket.description}</p></div>
          {ticket.resolution && <div><p className="text-slate-400 text-xs mb-1">Résolution</p><p className="bg-green-50 p-3 rounded-md text-sm">{ticket.resolution}</p></div>}
          {ticket.confirmed_by_user && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm font-medium">✅ Résolution confirmée</p>}
        </CardContent>
      </Card>

      {/* CONFIRMATION EMPLOYÉ */}
      {canConfirm && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">Problème résolu ?</p>
              <p className="text-sm text-green-600">Confirmez que le problème est bien résolu</p>
            </div>
            <Button onClick={handleConfirm} disabled={saving} className="bg-green-600 hover:bg-green-700">
              ✅ Confirmer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PARTIE 2 : COMPTE RENDU IT */}
      {isIT && (
        <Card className="border-blue-200">
          <CardHeader className="pb-3 bg-blue-50 rounded-t-lg">
            <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
              Partie 2 — Compte rendu d'intervention (IT)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {['admin_it', 'admin_principal'].includes(profile?.role) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Assigner à un technicien</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white" value={selectedTech} onChange={e => setSelectedTech(e.target.value)}>
                  <option value="">-- Choisir --</option>
                  {techniciens.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Statut</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                <option value="ouvert">Ouvert</option>
                <option value="en_cours">En cours</option>
                <option value="en_attente">En attente</option>
                <option value="resolu">Résolu</option>
                <option value="clos">Clos</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Diagnostic</label>
              <textarea className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" rows={3} placeholder="Décrivez le diagnostic..." value={diagnostic} onChange={e => setDiagnostic(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Solution apportée</label>
              <textarea className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" rows={3} placeholder="Décrivez la solution..." value={resolution} onChange={e => setResolution(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Durée d'intervention</label>
              <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" placeholder="Ex: 1h30" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <Button onClick={handleUpdate} disabled={saving} className="w-full">
              {saving ? 'Enregistrement...' : 'Enregistrer le compte rendu'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
