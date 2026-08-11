import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function AssetForm() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('assets').insert({
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
      if (error) throw error
      navigate('/assets')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nouvel équipement</h1>
          <p className="text-slate-500 text-sm">Enregistrer un équipement dans le parc</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations de l'équipement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Référence *</Label>
                <Input
                  id="reference"
                  placeholder="Ex: PC-001"
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
                  placeholder="Ex: Dell, HP, Lenovo..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modèle</Label>
                <Input
                  id="model"
                  placeholder="Ex: Latitude 5420"
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
                  placeholder="Ex: SN123456789"
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
              <Label htmlFor="assigned">Affecté à</Label>
              <select
                id="assigned"
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
                <Label htmlFor="dept">Département</Label>
                <select
                  id="dept"
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
                <Label htmlFor="service">Service</Label>
                <select
                  id="service"
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
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                placeholder="Ex: Bâtiment A, Bureau 12"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Informations complémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
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
