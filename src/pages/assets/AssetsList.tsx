// ============================================================
// ASSETSLIST.TSX - SGST GESTION PARC INFORMATIQUE
// Liste + Création + Modification équipements — tout inline
// ============================================================

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Plus, Eye, Printer, Trash2 } from 'lucide-react'

type View = 'list' | 'new' | 'detail'

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function AssetsList() {
  const { profile } = useAuth()
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => { fetchAssets() }, [])

  async function fetchAssets() {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*, assigned:assigned_to(full_name, email), department:department_id(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setAssets(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    setView('list')
    setSelectedId(null)
    fetchAssets()
  }

  if (view === 'new') return <AssetForm onBack={goBack} />
  if (view === 'detail' && selectedId) return <AssetDetail assetId={selectedId} onBack={goBack} />

  const statusColor = (s: string) => {
    switch (s) {
      case 'en_service': return 'bg-green-100 text-green-700'
      case 'en_panne': return 'bg-red-100 text-red-700'
      case 'en_maintenance': return 'bg-yellow-100 text-yellow-700'
      case 'en_stock': return 'bg-blue-100 text-blue-700'
      case 'reforme': return 'bg-slate-100 text-slate-500'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const canEdit = ['admin_principal', 'admin_it', 'adjoint_it'].includes(profile?.role || '')

  if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Équipements</h1>
          <p className="text-slate-500 text-sm mt-1">{assets.length} équipement(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer size={16} /> Imprimer
          </Button>
          {canEdit && (
            <Button onClick={() => setView('new')} className="flex items-center gap-2">
              <Plus size={16} /> Nouvel équipement
            </Button>
          )}
        </div>
      </div>

      {/* TABLEAU */}
      <Card>
        <CardContent className="p-0">
          {assets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 mb-4">Aucun équipement enregistré</p>
              {canEdit && (
                <Button onClick={() => setView('new')}>
                  <Plus size={16} className="mr-2" /> Ajouter un équipement
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Référence</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Marque / Modèle</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Affecté à</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Département</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{asset.reference}</td>
                      <td className="px-4 py-3 text-slate-600">{asset.type}</td>
                      <td className="px-4 py-3 text-slate-600">{asset.brand || '—'} {asset.model || ''}</td>
                      <td className="px-4 py-3 text-slate-600">{asset.assigned?.full_name || asset.assigned?.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{asset.department?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(asset.status)}`}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedId(asset.id); setView('detail') }} className="flex items-center gap-1">
                            <Eye size={14} /> Voir
                          </Button>
                        )}
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
// FORMULAIRE NOUVEL ÉQUIPEMENT
// ============================================================
function AssetForm({ onBack }: { onBack: () => void }) {
  const [departments, setDepartments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isShared, setIsShared] = useState(false)
  const [sharedUsers, setSharedUsers] = useState<string[]>([])

  const [reference, setReference] = useState('')
  const [type, setType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [status, setStatus] = useState('en_service')
  const [assignedTo, setAssignedTo] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (departmentId) fetchServices(departmentId)
    else setServices([])
  }, [departmentId])

  async function fetchDepartments() {
    const { data } = await supabase.from('departments').select('id, name').order('name')
    setDepartments(data || [])
  }

  async function fetchServices(deptId: string) {
    const { data } = await supabase.from('services').select('id, name').eq('department_id', deptId).order('name')
    setServices(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name')
    setUsers(data || [])
  }

  function toggleSharedUser(id: string) {
    setSharedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('assets').insert({
        reference,
        type,
        brand: brand || null,
        model: model || null,
        serial_number: serialNumber || null,
        status,
        assigned_to: isShared ? null : (assignedTo || null),
        department_id: departmentId || null,
        service_id: serviceId || null,
        location: location || null,
        notes: notes || null,
      }).select().single()
      if (error) throw error

      // Enregistrer les utilisateurs partagés
      if (isShared && sharedUsers.length > 0 && data) {
        await supabase.from('asset_shared_users').insert(
          sharedUsers.map(userId => ({ asset_id: data.id, user_id: userId }))
        )
      }

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
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nouvel équipement</h1>
          <p className="text-slate-500 text-sm">Enregistrer un équipement dans le parc</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
          <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Informations de l'équipement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Référence *</label>
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Ex: PC-001" value={reference} onChange={e => setReference(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type *</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={type} onChange={e => setType(e.target.value)} required>
                  <option value="">-- Choisir --</option>
                  <option value="Ordinateur fixe">Ordinateur fixe</option>
                  <option value="Ordinateur portable">Ordinateur portable</option>
                  <option value="Imprimante">Imprimante</option>
                  <option value="Imprimante réseau">Imprimante réseau</option>
                  <option value="Scanner">Scanner</option>
                  <option value="Écran">Écran</option>
                  <option value="Serveur">Serveur</option>
                  <option value="Équipement réseau">Équipement réseau</option>
                  <option value="Onduleur">Onduleur</option>
                  <option value="Accessoire">Accessoire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Marque</label>
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Ex: Dell, HP..." value={brand} onChange={e => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Modèle</label>
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Ex: Latitude 5420" value={model} onChange={e => setModel(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Numéro de série</label>
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Ex: SN123456" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Statut</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="en_service">En service</option>
                  <option value="en_panne">En panne</option>
                  <option value="en_maintenance">En maintenance</option>
                  <option value="en_stock">En stock</option>
                  <option value="reforme">Réformé</option>
                </select>
              </div>
            </div>

            {/* AFFECTATION */}
            <div className="border border-slate-200 rounded-md p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={e => setIsShared(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">
                  Équipement partagé (ex: imprimante réseau)
                </span>
              </label>

              {!isShared ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Affecté à</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                    <option value="">-- Non affecté --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Utilisateurs ayant accès à cet équipement
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 rounded-md p-2">
                    {users.map(u => (
                      <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sharedUsers.includes(u.id)}
                          onChange={() => toggleSharedUser(u.id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{u.full_name || '—'}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">{sharedUsers.length} utilisateur(s) sélectionné(s)</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Département</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                  <option value="">-- Aucun --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Service</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50" value={serviceId} onChange={e => setServiceId(e.target.value)} disabled={!departmentId}>
                  <option value="">-- Aucun --</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Localisation</label>
              <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Ex: Bâtiment A, Bureau 12" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <textarea className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" rows={3} placeholder="Informations complémentaires..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
              <Button type="button" variant="outline" onClick={onBack}>Annuler</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// DÉTAIL / MODIFICATION ÉQUIPEMENT
// ============================================================
function AssetDetail({ assetId, onBack }: { assetId: string, onBack: () => void }) {
  const [departments, setDepartments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [reference, setReference] = useState('')
  const [type, setType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [status, setStatus] = useState('en_service')
  const [assignedTo, setAssignedTo] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchAsset()
    fetchDepartments()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (departmentId) fetchServices(departmentId)
    else setServices([])
  }, [departmentId])

  async function fetchAsset() {
    try {
      const { data } = await supabase.from('assets').select('*').eq('id', assetId).maybeSingle()
      if (data) {
        setReference(data.reference || '')
        setType(data.type || '')
        setBrand(data.brand || '')
        setModel(data.model || '')
        setSerialNumber(data.serial_number || '')
        setStatus(data.status || 'en_service')
        setAssignedTo(data.assigned_to || '')
        setDepartmentId(data.department_id || '')
        setServiceId(data.service_id || '')
        setLocation(data.location || '')
        setNotes(data.notes || '')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDepartments() {
    const { data } = await supabase.from('departments').select('id, name').order('name')
    setDepartments(data || [])
  }

  async function fetchServices(deptId: string) {
    const { data } = await supabase.from('services').select('id, name').eq('department_id', deptId).order('name')
    setServices(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name')
    setUsers(data || [])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const { error } = await supabase.from('assets').update({
        reference,
        type,
        brand: brand || null,
        model: model || null,
        serial_number: serialNumber || null,
        status,
        assigned_to: assignedTo || null,
        department_id: departmentId || null,
        service_id: serviceId || null,
        location: location || null,
        notes: notes || null,
      }).eq('id', assetId)
      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cet équipement définitivement ?')) return
    await supabase.from('assets').delete().eq('id', assetId)
    onBack()
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{reference}</h1>
            <p className="text-slate-500 text-sm">Modifier l'équipement</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer size={16} /> Imprimer
          </Button>
          <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-2" onClick={handleDelete}>
            <Trash2 size={16} /> Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
          <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Informations de l'équipement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSave} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Référence *</label>
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" value={reference} onChange={e => setReference(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type *</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={type} onChange={e => setType(e.target.value)} required>
                  <option value="">-- Choisir --</option>
                  <option value="Ordinateur fixe">Ordinateur fixe</option>
                  <option value="Ordinateur portable">Ordinateur portable</option>
                  <option value="Imprimante">Imprimante</option>
                  <option value="Scanner">Scanner</option>
                  <option value="Écran">Écran</option>
                  <option value="Serveur">Serveur</option>
                  <option value="Équipement réseau">Équipement réseau</option>
                  <option value="Onduleur">Onduleur</option>
                  <option value="Accessoire">Accessoire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Marque</label>
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" value={brand} onChange={e => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Modèle</label>
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" value={model} onChange={e => setModel(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Numéro de série</label>
                <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Statut</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="en_service">En service</option>
                  <option value="en_panne">En panne</option>
                  <option value="en_maintenance">En maintenance</option>
                  <option value="en_stock">En stock</option>
                  <option value="reforme">Réformé</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Affecté à</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="">-- Non affecté --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Département</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                  <option value="">-- Aucun --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Service</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50" value={serviceId} onChange={e => setServiceId(e.target.value)} disabled={!departmentId}>
                  <option value="">-- Aucun --</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Localisation</label>
              <input className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Ex: Bâtiment A, Bureau 12" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <textarea className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">✅ Équipement mis à jour</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</Button>
              <Button type="button" variant="outline" onClick={onBack}>Annuler</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
