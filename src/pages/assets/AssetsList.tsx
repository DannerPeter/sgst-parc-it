import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Plus, Eye } from 'lucide-react'

export default function AssetsList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
  }, [])

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

  const statusColor = (status: string) => {
    switch (status) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Équipements</h1>
          <p className="text-slate-500 text-sm mt-1">{assets.length} équipement(s)</p>
        </div>
        {canEdit && (
          <Button onClick={() => navigate('/assets/new')} className="flex items-center gap-2">
            <Plus size={16} />
            Nouvel équipement
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {assets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Aucun équipement enregistré</p>
              {canEdit && (
                <Button className="mt-4" onClick={() => navigate('/assets/new')}>
                  Ajouter le premier équipement
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
                      <td className="px-4 py-3 text-slate-600">
                        {asset.brand || '—'} {asset.model || ''}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {asset.assigned?.full_name || asset.assigned?.email || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {asset.department?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(asset.status)}`}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/assets/${asset.id}`)}
                            className="flex items-center gap-1"
                          >
                            <Eye size={14} />
                            Voir
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
