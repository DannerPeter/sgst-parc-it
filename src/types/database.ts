export type UserRole = 'admin_principal' | 'admin_it' | 'adjoint_it' | 'dg' | 'employe'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  matricule: string | null
  role: UserRole
  department_id: string | null
  service_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  created_at: string
}

export interface Service {
  id: string
  name: string
  department_id: string | null
  created_at: string
}

export interface Asset {
  id: string
  reference: string
  type: string
  brand: string | null
  model: string | null
  serial_number: string | null
  status: string
  assigned_to: string | null
  department_id: string | null
  service_id: string | null
  location: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  ticket_number: string
  requester_id: string | null
  asset_id: string | null
  subject: string
  description: string
  priority: 'basse' | 'normale' | 'haute' | 'urgente'
  status: 'ouvert' | 'en_cours' | 'en_attente' | 'resolu' | 'clos'
  assigned_to: string | null
  resolution: string | null
  resolved_at: string | null
  confirmed_by_user: boolean
  confirmed_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface TicketStatusHistory {
  id: string
  ticket_id: string
  old_status: string | null
  new_status: string
  changed_by: string | null
  note: string | null
  changed_at: string
}
