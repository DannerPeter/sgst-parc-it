import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Plus, Pencil } from 'lucide-react'

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('employe')
  const [departmentId, setDepartmentId] = useState('')
  const [matricule, setMatricule] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, department:department_id(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data || [])
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

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
        },
      })
      if (error) throw error

      // Mettre à jour le profil avec les infos supplémentaires
      if (data.user) {
        await supabase.from('profiles').update({
          full_name: fullName,
          role,
          department_id: departmentId || null,
          matricule: matricule || null,
          phone: phone || null,
        }).eq('id', data.user.id)
      }

      setSuccess(`Utilisateur ${fullName} créé avec succès !`)
      resetForm()
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', userId)
    fetchUsers()
  }

  function resetForm() {
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('employe')
    setDepartmentId('')
    setMatricule('')
    setPhone('')
  }

  const roleLabel: Record<string, string> = {
    admin_principal: '👑 Admin Principal',
    admin_it: '🖥️ Admin IT',
    adjoint_it: '🔧 Adjoint IT',
    dg: '📊 DG',
    employe: '👤 Employé',
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} utilisateur(s)</p>
        </div>
        <Button onClick={() => { setShowDialog(true); setError(null); setSuccess(null) }} className="flex items-center gap-2">
          <Plus size={16} />
          Nouvel utilisateur
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Nom</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Rôle</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Département</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {user.full_name || '—'}
                        {user.matricule && <span className="ml-2 text-xs text-slate-400">({user.matricule})</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {roleLabel[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.department?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(user.id, user.is_active)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Pencil size={12} />
                          {user.is_active ? 'Désactiver' : 'Activer'}
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

      {/* Dialog création utilisateur */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                placeholder="Prénom Nom"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@sgst.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="employe">👤 Employé</option>
                <option value="adjoint_it">🔧 Adjoint IT</option>
                <option value="admin_it">🖥️ Administrateur IT</option>
                <option value="dg">📊 Direction Générale</option>
                <option value="admin_principal">👑 Administrateur Principal</option>
              </select>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule</Label>
                <Input
                  id="matricule"
                  placeholder="Ex: EMP-001"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+241 00 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">✅ {success}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Création...' : 'Créer'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
