import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

export default function Departments() {
  const [departments, setDepartments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newDept, setNewDept] = useState('')
  const [newService, setNewService] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [savingDept, setSavingDept] = useState(false)
  const [savingService, setSavingService] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (selectedDept) fetchServices(selectedDept)
    else setServices([])
  }, [selectedDept])

  async function fetchAll() {
    try {
      const { data } = await supabase
        .from('departments')
        .select('*')
        .order('name')
      setDepartments(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchServices(deptId: string) {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('department_id', deptId)
      .order('name')
    setServices(data || [])
  }

  async function handleAddDept(e: React.FormEvent) {
    e.preventDefault()
    if (!newDept.trim()) return
    setSavingDept(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('departments')
        .insert({ name: newDept.trim() })
      if (error) throw error
      setNewDept('')
      fetchAll()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingDept(false)
    }
  }

  async function handleDeleteDept(id: string) {
    if (!confirm('Supprimer ce département ?')) return
    await supabase.from('departments').delete().eq('id', id)
    if (selectedDept === id) setSelectedDept('')
    fetchAll()
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    if (!newService.trim() || !selectedDept) return
    setSavingService(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('services')
        .insert({ name: newService.trim(), department_id: selectedDept })
      if (error) throw error
      setNewService('')
      fetchServices(selectedDept)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingService(false)
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm('Supprimer ce service ?')) return
    await supabase.from('services').delete().eq('id', id)
    fetchServices(selectedDept)
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Départements & Services</h1>
        <p className="text-slate-500 text-sm mt-1">Gérez la structure organisationnelle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Départements */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <h2 className="font-semibold text-slate-800 mb-4">Départements</h2>

              {/* Ajouter */}
              <form onSubmit={handleAddDept} className="flex gap-2 mb-4">
                <Input
                  placeholder="Nom du département"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  required
                />
                <Button type="submit" disabled={savingDept} size="sm">
                  <Plus size={16} />
                </Button>
              </form>

              {/* Liste */}
              <div className="space-y-2">
                {departments.length === 0 ? (
                  <p className="text-slate-400 text-sm">Aucun département</p>
                ) : (
                  departments.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDept(dept.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        selectedDept === dept.id
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className="text-sm font-medium">{dept.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id) }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <h2 className="font-semibold text-slate-800 mb-1">Services</h2>
              {!selectedDept ? (
                <p className="text-slate-400 text-sm mt-4">
                  ← Sélectionnez un département pour voir ses services
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-4">
                    {departments.find(d => d.id === selectedDept)?.name}
                  </p>

                  {/* Ajouter */}
                  <form onSubmit={handleAddService} className="flex gap-2 mb-4">
                    <Input
                      placeholder="Nom du service"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      required
                    />
                    <Button type="submit" disabled={savingService} size="sm">
                      <Plus size={16} />
                    </Button>
                  </form>

                  {/* Liste */}
                  <div className="space-y-2">
                    {services.length === 0 ? (
                      <p className="text-slate-400 text-sm">Aucun service dans ce département</p>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 text-slate-800"
                        >
                          <span className="text-sm">{service.name}</span>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
      )}
    </div>
  )
}
