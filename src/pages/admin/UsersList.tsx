// ============================================================
// USERSLIST.TSX - SGST GESTION PARC INFORMATIQUE
// Gestion utilisateurs - création + modification + activation
// ============================================================

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Plus, Pencil } from 'lucide-react'

type ViewMode = 'list' | 'create' | 'edit'

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Champs formulaire
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

  // ---- OUVRIR FORMULAIRE CRÉATION ----
  function openCreate() {
    resetForm()
    setError(null)
    setSuccess(null)
    setViewMode('create')
  }

  // ---- OUVRIR FORMULAIRE MODIFICATION ----
  function openEdit(user: any) {
    setSelectedUser(user)
    setFullName(user.full_name || '')
    setEmail(user.email || '')
    setPassword('')
    setRole(user.role || 'employe')
    setDepartmentId(user.department_id || '')
    setMatricule(user.matricule || '')
    setPhone(user.phone || '')
    setError(null)
    setSuccess(null)
    setViewMode('edit')
  }

  function resetForm() {
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('employe')
    setDepartmentId('')
    setMatricule('')
    setPhone('')
    setSelectedUser(null)
  }

  // ---- CRÉER UTILISATEUR ----
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      })
      if (error) throw error

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          department_id: departmentId || null,
          matricule: matricule || null,
          phone: phone || null,
        })
      }

      setSuccess(`✅ Utilisateur ${fullName} créé avec succès !`)
      resetForm()
      fetchUsers()
      setTimeout(() => setViewMode('list'), 1500)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  // ---- MODIFIER UTILISATEUR ----
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          role,
          department_id: departmentId || null,
          matricule: matricule || null,
          phone: phone || null,
        })
        .eq('id', selectedUser.id)
      if (error) throw error

      setSuccess('✅ Utilisateur mis à jour avec succès !')
      fetchUsers()
      setTimeout(() => setViewMode('list'), 1500)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification')
    } finally {
      setSaving(false)
    }
  }

  // ---- ACTIVER / DÉSACTIVER ----
  async function toggleActive(userId: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', userId)
    fetchUsers()
  }

  const roleLabel: Record<string, string> = {
    admin_principal: '👑 Admin Principal',
    admin_it: '🖥️ Admin IT',
    adjoint_it: '🔧 Adjoint IT',
    dg: '📊 DG',
    employe: '👤 Employé',
  }

  if (loading) return <p className="text-muted-foreground">Chargement...</p>

  // ============================================================
  // VUE FORMULAIRE CRÉATION
  // ============================================================
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>← Retour</Button>
          <div>
            <h1 className="text-2xl font-bold">
              {viewMode === 'create' ? 'Nouvel utilisateur' : `Modifier — ${selectedUser?.full_name || selectedUser?.email}`}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {viewMode === 'create' ? 'Créer un nouveau compte utilisateur' : 'Modifier les informations de cet utilisateur'}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={viewMode === 'create' ? handleCreate : handleEdit} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet *</Label>
                  <Input placeholder="Prénom Nom" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="email@sgst.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={viewMode === 'edit'}
                    className={viewMode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}
                  />
                </div>
              </div>

              {viewMode === 'create' && (
                <div className="space-y-2">
                  <Label>Mot de passe *</Label>
                  <Input type="password" placeholder="Minimum 6 caractères" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rôle *</Label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="employe">👤 Employé</option>
                    <option value="adjoint_it">🔧 Adjoint IT</option>
                    <option value="admin_it">🖥️ Administrateur IT</option>
                    <option value="dg">📊 Direction Générale</option>
                    <option value="admin_principal">👑 Administrateur Principal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Département</Label>
                  <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">-- Aucun --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Matricule</Label>
                  <Input placeholder="EMP-001" value={matricule} onChange={e => setMatricule(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input placeholder="+241 00 00 00 00" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Enregistrement...' : viewMode === 'create' ? 'Créer' : 'Enregistrer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setViewMode('list')}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // VUE LISTE
  // ============================================================
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} utilisateur(s)</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} />
          Nouvel utilisateur
        </Button>
      </div>

      {/* TABLEAU */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rôle</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Département</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {user.full_name || '—'}
                        {user.matricule && <span className="ml-2 text-xs text-muted-foreground">({user.matricule})</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-foreground font-medium">
                          {roleLabel[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.department?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(user)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Pencil size={12} />
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(user.id, user.is_active)}
                            className={`text-xs ${user.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}`}
                          >
                            {user.is_active ? 'Désactiver' : 'Activer'}
                          </Button>
                        </div>
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
