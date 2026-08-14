// ============================================================
// JOURNAL.TSX - SGST GESTION PARC INFORMATIQUE
// Journal général des interventions IT
// Visible : admin_principal, admin_it, adjoint_it
// ============================================================

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Printer } from 'lucide-react'
import { previewPrint } from '../../lib/print'

export default function Journal() {
  const [interventions, setInterventions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchInterventions()
  }, [])

  async function fetchInterventions() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          requester:requester_id(full_name, email, phone, department_id, service_id),
          assigned:assigned_to(full_name, email),
          asset:asset_id(reference, type, brand, model)
        `)
        .not('resolution', 'is', null)
        .order('updated_at', { ascending: false })
      if (error) throw error
      setInterventions(data || [])
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

  const filtered = interventions.filter(i => {
    const matchStatus = filterStatus ? i.status === filterStatus : true
    const matchDate = filterDate ? i.created_at?.startsWith(filterDate) : true
    const matchSearch = search
      ? (i.subject?.toLowerCase().includes(search.toLowerCase()) ||
        i.requester?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        i.assigned?.full_name?.toLowerCase().includes(search.toLowerCase()))
      : true
    return matchStatus && matchDate && matchSearch
  })

  if (loading) return <p className="text-muted-foreground">Chargement...</p>

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journal des interventions</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} intervention(s)</p>
        </div>
        <Button variant="outline" onClick={() => previewPrint('journal-content')} className="flex items-center gap-2">
          <Printer size={16} /> Aperçu PDF
        </Button>
      </div>

      {/* FILTRES */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Recherche</label>
              <input
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Objet, demandeur, technicien..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Statut</label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="resolu">Résolu</option>
                <option value="clos">Clos</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
            </div>
          </div>
          {(search || filterStatus || filterDate) && (
            <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => { setSearch(''); setFilterStatus(''); setFilterDate('') }}>
              Réinitialiser les filtres
            </Button>
          )}
        </CardContent>
      </Card>

      {/* TABLEAU */}
      <div id="journal-content">
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Aucune intervention trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Ticket</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Objet</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Demandeur</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Technicien</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Équipement</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Résolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((i) => (
                      <tr key={i.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i.ticket_number}</td>
                        <td className="px-4 py-3 font-medium max-w-xs truncate">{i.subject}</td>
                        <td className="px-4 py-3 text-muted-foreground">{i.requester?.full_name || i.requester?.email || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{i.assigned?.full_name || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {i.asset ? `${i.asset.reference} (${i.asset.type})` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(i.status)}`}>
                            {i.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(i.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                          {i.resolution || '—'}
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
    </div>
  )
}
