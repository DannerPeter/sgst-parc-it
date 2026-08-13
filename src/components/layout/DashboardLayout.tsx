// ============================================================
// DASHBOARDLAYOUT.TSX - SGST GESTION PARC INFORMATIQUE
// Layout principal avec sidebar collapsible + header moderne
// ============================================================

import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AppSidebar } from '../app-sidebar'
import {
  SidebarProvider, SidebarInset, SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Bell, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ---- BREADCRUMB MAP ----
const breadcrumbMap: Record<string, { parent?: string, parentPath?: string, label: string }> = {
  '/dashboard': { label: 'Tableau de bord' },
  '/tickets': { label: 'Tickets', parent: 'Support IT' },
  '/assets': { label: 'Équipements', parent: 'Parc IT' },
  '/profile': { label: 'Mon profil', parent: 'Compte' },
  '/users': { label: 'Utilisateurs', parent: 'Administration' },
  '/departments': { label: 'Départements', parent: 'Administration' },
  '/stats': { label: 'Statistiques', parent: 'Analyse' },
}

export default function DashboardLayout() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (!loading && !profile) navigate('/login', { replace: true })
  }, [profile, loading, navigate])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  )

  if (!profile) return null

  const crumb = breadcrumbMap[location.pathname]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>

        {/* ---- HEADER ---- */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* BREADCRUMB */}
            <Breadcrumb>
              <BreadcrumbList>
                {crumb?.parent && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">{crumb.parent}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{crumb?.label || 'SGST'}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* ACTIONS HEADER */}
          <div className="flex items-center gap-2">

            {/* TOGGLE DARK MODE */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-full"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            {/* NOTIFICATIONS */}
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* AVATAR */}
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm cursor-pointer">
              {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
            </div>

          </div>
        </header>

        {/* ---- CONTENU PRINCIPAL ---- */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 bg-muted/20 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

      </SidebarInset>
    </SidebarProvider>
  )
}
