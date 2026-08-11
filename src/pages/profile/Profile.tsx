import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'

export default function Profile() {
  const { profile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleLabel: Record<string, string> = {
    admin_principal: '👑 Administrateur Principal',
    admin_it: '🖥️ Administrateur IT',
    adjoint_it: '🔧 Adjoint IT',
    dg: '📊 Direction Générale',
    employe: '👤 Employé',
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', profile?.id)
      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mon profil</h1>
        <p className="text-slate-500 text-sm mt-1">Consultez et modifiez vos informations</p>
      </div>

      {/* Infos non modifiables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Email</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Rôle</span>
            <span className="font-medium">{roleLabel[profile.role] || profile.role}</span>
          </div>
          {profile.matricule && (
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Matricule</span>
              <span className="font-medium">{profile.matricule}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Membre depuis</span>
            <span className="font-medium">
              {new Date(profile.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Infos modifiables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modifier mes informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Prénom Nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+241 00 00 00 00"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                ✅ Profil mis à jour avec succès
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}