// ============================================================
// LOGIN.TSX - SGST GESTION PARC INFORMATIQUE
// Page de connexion - Design moderne
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Monitor } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ---- PANNEAU GAUCHE : Branding ---- */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">

        {/* Cercles décoratifs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-slate-800 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-slate-800 rounded-full translate-x-1/3 translate-y-1/3 opacity-50" />

        <div className="relative z-10 text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <Monitor size={40} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">SGST</h1>
            <p className="text-slate-400 mt-2 text-lg">Gestion du Parc Informatique</p>
          </div>
          <div className="space-y-3 text-left">
            {[
              '✅ Gestion centralisée du parc IT',
              '✅ Suivi des tickets en temps réel',
              '✅ Tableau de bord intelligent',
              '✅ Rapports et statistiques',
            ].map((item, i) => (
              <p key={i} className="text-slate-300 text-sm">{item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* ---- PANNEAU DROIT : Formulaire ---- */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md space-y-8">

          {/* Logo mobile */}
          <div className="lg:hidden text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Monitor size={32} className="text-white" />
            </div>
          </div>

          {/* Titre */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Connexion</h2>
            <p className="text-slate-500 mt-1">Bienvenue sur SGST — Parc Informatique</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Adresse email</label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>

            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-400">
                <span className="bg-white px-3">ou</span>
              </div>
            </div>

            {/* Bouton inscription */}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors text-sm"
            >
              Créer un compte Administrateur
            </button>

          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400">
            SGST © {new Date().getFullYear()} — Système de Gestion du Support Technique
          </p>
        </div>
      </div>
    </div>
  )
}
