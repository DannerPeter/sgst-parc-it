// ============================================================
// LOGIN.TSX - SGST GESTION PARC INFORMATIQUE
// Page de connexion publique
// Accessible sur : /login
// Redirige vers : /dashboard après connexion réussie
// Lien vers : /register pour créer un compte Admin
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()

  // ---- ÉTATS ----
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ---- CONNEXION ----
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      // Redirection vers le dashboard après connexion réussie
      navigate('/dashboard', { replace: true })
    }
  }

  // ---- RENDU ----
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md px-4">

        {/* ---- LOGO ---- */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">SGST</h1>
          <p className="text-slate-500 mt-1">Gestion du Parc Informatique</p>
        </div>

        {/* ---- CARTE CONNEXION ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">

              {/* EMAIL */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* MOT DE PASSE */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {/* Bouton afficher/masquer mot de passe */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* MESSAGE ERREUR */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
              )}

              {/* BOUTON CONNEXION */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>

              {/* SÉPARATEUR */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400">
                  <span className="bg-white px-2">ou</span>
                </div>
              </div>

              {/* BOUTON INSCRIPTION ADMIN */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/register')}
              >
                Créer un compte Administrateur
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* ---- FOOTER ---- */}
        <p className="text-center text-xs text-slate-400 mt-6">
          SGST © {new Date().getFullYear()} — Gestion du Parc Informatique
        </p>

      </div>
    </div>
  )
}

