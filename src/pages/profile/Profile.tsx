// ============================================================
// PROFILE.TSX - SGST GESTION PARC INFORMATIQUE
// Page profil utilisateur - consultation et modification
// ============================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Printer } from 'lucide-react'

export default function Profile() {
  const { profile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [matricule, setMatricule] = useState('')
  const [department, setDepartment] = useState<any>(null)
  const [service, setService] = useState<any>(null)
  const [assets, setAssets] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setMatricule(profile.matricule || '')
      fetchDeptService()
      fetchMyAssets()
    }
  }, [profile])

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

  async function fetchMyAssets() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('assets')
      .select('id, reference, type, brand, model, status')
      .eq('assigned_to', profile.id)
    setAssets(data || [])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          matricule,
        })
        .eq('id', profile?.id)
      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel: Record<string, string> = {
    admin_principal: '👑 Administrateur Principal',
    admin_it: '🖥️ Administrateur IT',
    adjoint_it: '🔧 Adjoint IT',
    dg: '📊 Direction Générale',
    employe: '👤 Employé',
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'en_service': return 'bg-green-100 text-green-700'
      case 'en_panne': return 'bg-red-100 text-red-700'
      case 'en_maintenance': return 'bg-yellow-100 text-yellow-700'
      case 'en_stock': return 'bg-blue-100 text-blue-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (!profile) return <p className="text-slate-500">Chargement...</p>

  return (
    <div className="space-y-6 max-w-2xl">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mon profil</h1>
          <p className="text-slate-500 text-sm mt-1">Consultez et modifiez vos informations</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
          <Printer size={16} /> Imprimer
        </Button>
      </div>

      {/* INFOS NON MODIFIABLES */}
      <Card>
        <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
          <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Informations du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2 flex items-center gap-4 pb-3 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xl">
                {(profile.full_name || profile.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-base">{profile.full_name || '—'}</p>
                <p className="text-slate-500">{profile.email}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-1 inline-block">
                  {roleLabel[profile.role] || profile.role}
                </span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Département</p>
              <p className="font-medium text-slate-800">{department?.name || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Service</p>
              <p className="font-medium text-slate-800">{service?.name || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Membre depuis</p>
              <p className="font-medium text-slate-800">{new Date(profile.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Statut</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {profile.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INFOS MODIFIABLES */}
      <Card>
        <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
          <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Modifier mes informations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Prénom Nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+241 00 00 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule</Label>
              <Input
                id="matricule"
                value={matricule}
                onChange={e => setMatricule(e.target.value)}
                placeholder="Ex: EMP-001"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">✅ Profil mis à jour avec succès</p>}

            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* MES ÉQUIPEMENTS */}
      {assets.length > 0 && (
        <Card>
          <CardHeader className="pb-3 bg-slate-50 rounded-t-lg">
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Mes équipements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {assets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-slate-800">{asset.reference} — {asset.brand} {asset.model}</p>
                  <p className="text-xs text-slate-400">{asset.type}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(asset.status)}`}>
                  {asset.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
