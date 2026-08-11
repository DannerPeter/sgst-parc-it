// ============================================================
// ASSETDETAIL.TSX - SGST GESTION PARC INFORMATIQUE
// Page détail + modification d'un équipement
// Accessible sur : /assets/:id
// Rôles : admin_principal, admin_it, adjoint_it
// ============================================================

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

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
    if (!id || id === 'undefined') {
      navigate('/assets')
      return
    }
    fetchAsset()
    fetchDepartments()
    fetchUsers()
  }, [id])

  useEffect(() => {
    if (departmentId) fetchServices(departmentId)
    else setServices([])
  }, [departmentId])

  async function fetchAsset() {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
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
    const { data } = await supabase
      .from('services')
      .select('id, name')
      .eq('department_id', deptId)
      .order('name')
    setServices(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name')
    setUsers(data || [])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const { error } = await supabase
        .from('assets')
        .update({
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
        })
        .eq('id', id)
      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cet équipement définitivement ?')) return
    await supabase.from('assets').delete().eq('id', id)
    navigate('/assets')
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ---- HEADER ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{reference}</h1>
            <p className="text-slate-500 text-sm">Modifier l'équipement</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-red-500 border-red-200 hover:bg-red-50"
          onClick={handleDelete}
        >
          Supprimer
        </Button>
      </div>

      {/* ---- FORMULAIRE ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations de l'équipement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Référence *</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
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
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modèle</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serial">Numéro de série</Label>
                <Input
                  id="serial"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="en_service">En service</option>
                  <option value="en_panne">En panne</option>
                  <option value="en_maintenance">En maintenance</option>
                  <option value="en_stock">En stock</option>
                  <option value="reforme">Réformé</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Affecté à</Label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">-- Non affecté --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Département</Label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">-- Aucun --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Service</Label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  disabled={!departmentId}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                >
                  <option value="">-- Aucun --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Localisation</Label>
              <Input
                placeholder="Ex: Bâtiment A, Bureau 12"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">✅ Équipement mis à jour avec succès</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/assets')}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

