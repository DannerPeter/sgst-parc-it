// ============================================================
// APP-SIDEBAR.TSX - SGST GESTION PARC INFORMATIQUE
// Sidebar collapsible avec icônes
// ============================================================

import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Monitor, Ticket, Users,
  Building2, LogOut, User, BarChart3,
  ChevronUp, BookOpen,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarHeader, SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppSidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const role = profile?.role

  const isActive = (path: string) => location.pathname === path

  return (
    <Sidebar collapsible="icon">

      {/* ---- LOGO ---- */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => navigate('/dashboard')}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Monitor className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SGST</span>
                <span className="truncate text-xs text-muted-foreground">Parc Informatique</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ---- NAVIGATION ---- */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              {/* DASHBOARD */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/dashboard')} isActive={isActive('/dashboard')} tooltip="Tableau de bord">
                  <LayoutDashboard />
                  <span>Tableau de bord</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* TICKETS */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/tickets')} isActive={isActive('/tickets')} tooltip="Tickets">
                  <Ticket />
                  <span>{role === 'employe' ? 'Mes demandes' : 'Tickets'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* ÉQUIPEMENTS - IT uniquement */}
              {role !== 'employe' && role !== 'dg' && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/assets')} isActive={isActive('/assets')} tooltip="Équipements">
                    <Monitor />
                    <span>Équipements</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* JOURNAL IT */}
              {role !== 'employe' && role !== 'dg' && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/journal')} isActive={isActive('/journal')} tooltip="Journal IT">
                    <BookOpen />
                    <span>Journal IT</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* STATISTIQUES */}
              {(role === 'dg' || role === 'admin_principal') && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/stats')} isActive={isActive('/stats')} tooltip="Statistiques">
                    <BarChart3 />
                    <span>Statistiques</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ---- ADMINISTRATION ---- */}
        {role === 'admin_principal' && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate('/users')} isActive={isActive('/users')} tooltip="Utilisateurs">
                      <Users />
                      <span>Utilisateurs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate('/departments')} isActive={isActive('/departments')} tooltip="Départements">
                      <Building2 />
                      <span>Départements</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

      </SidebarContent>

      {/* ---- FOOTER PROFIL ---- */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent w-full">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-sm">
                    {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile?.full_name || profile?.email}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">{profile?.role?.replace('_', ' ')}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56 rounded-lg">
                <DropdownMenuItem onClick={() => navigate('/profile')} className="flex items-center gap-2 cursor-pointer">
                  <User size={16} />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-red-500 cursor-pointer">
                  <LogOut size={16} />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  )
}
