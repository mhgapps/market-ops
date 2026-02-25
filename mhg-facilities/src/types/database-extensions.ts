// Extension types for tables not yet in main database.ts
// These should be merged into database.ts when regenerating types

import type { Database as BaseDatabase } from './database'

export interface AssetTransferRow {
  id: string
  asset_id: string | null
  from_location_id: string | null
  to_location_id: string | null
  transferred_by: string | null
  transferred_at: string
  reason: string | null
  notes: string | null
}

export interface AssetTransferInsert {
  id?: string
  asset_id?: string | null
  from_location_id?: string | null
  to_location_id?: string | null
  transferred_by?: string | null
  transferred_at?: string
  reason?: string | null
  notes?: string | null
}

export interface AssetTypeRow {
  id: string
  tenant_id: string
  category_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AssetTypeInsert {
  id?: string
  tenant_id: string
  category_id: string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface AssetTypeUpdate {
  category_id?: string
  name?: string
  description?: string | null
  updated_at?: string
  deleted_at?: string | null
}

export interface VendorRatingRow {
  id: string
  vendor_id: string | null
  ticket_id: string | null
  rated_by: string | null
  rating: number | null
  response_time_rating: number | null
  quality_rating: number | null
  cost_rating: number | null
  comments: string | null
  created_at: string
}

export interface VendorRatingInsert {
  id?: string
  vendor_id?: string | null
  ticket_id?: string | null
  rated_by?: string | null
  rating?: number | null
  response_time_rating?: number | null
  quality_rating?: number | null
  cost_rating?: number | null
  comments?: string | null
  created_at?: string
}

export interface ComplianceDocumentTypeRow {
  id: string
  tenant_id: string
  name: string
  name_es: string | null
  description: string | null
  default_alert_days: number[] | null
  renewal_checklist: Record<string, unknown> | null
  is_location_specific: boolean | null
  created_at: string
  deleted_at: string | null
}

export interface ComplianceDocumentTypeInsert {
  id?: string
  tenant_id: string
  name: string
  name_es?: string | null
  description?: string | null
  default_alert_days?: number[] | null
  renewal_checklist?: Record<string, unknown> | null
  is_location_specific?: boolean | null
  created_at?: string
  deleted_at?: string | null
}

export interface PMTemplateRow {
  id: string
  tenant_id: string
  name: string
  description: string | null
  category: string | null
  checklist: Record<string, unknown> | null
  estimated_duration_hours: number | null
  default_vendor_id: string | null
  created_at: string
  deleted_at: string | null
}

export interface PMTemplateInsert {
  id?: string
  tenant_id: string
  name: string
  description?: string | null
  category?: string | null
  checklist?: Record<string, unknown> | null
  estimated_duration_hours?: number | null
  default_vendor_id?: string | null
  created_at?: string
  deleted_at?: string | null
}

export interface ComplianceAlertRow {
  id: string
  document_id: string | null
  alert_type: string | null
  sent_at: string
  sent_to: string[] | null
  delivery_method: string | null
}

export interface ComplianceAlertInsert {
  id?: string
  document_id?: string | null
  alert_type?: string | null
  sent_at?: string
  sent_to?: string[] | null
  delivery_method?: string | null
}

export interface PMCompletionRow {
  id: string
  schedule_id: string | null
  ticket_id: string | null
  scheduled_date: string
  completed_date: string | null
  completed_by: string | null
  checklist_results: Record<string, unknown> | null
  notes: string | null
  created_at: string
}

export interface PMCompletionInsert {
  id?: string
  schedule_id?: string | null
  ticket_id?: string | null
  scheduled_date: string
  completed_date?: string | null
  completed_by?: string | null
  checklist_results?: Record<string, unknown> | null
  notes?: string | null
  created_at?: string
}

export interface ComplianceDocumentVersionRow {
  id: string
  document_id: string | null
  file_path: string
  version_number: number
  uploaded_by: string | null
  notes: string | null
  created_at: string
}

export interface ComplianceDocumentVersionInsert {
  id?: string
  document_id?: string | null
  file_path: string
  version_number?: number
  uploaded_by?: string | null
  notes?: string | null
  created_at?: string
}

export interface BudgetRow {
  id: string
  tenant_id: string
  location_id: string | null
  category: string | null
  fiscal_year: number
  annual_budget: number
  spent_amount: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface BudgetInsert {
  id?: string
  tenant_id: string
  location_id?: string | null
  category?: string | null
  fiscal_year: number
  annual_budget: number
  spent_amount?: number
  notes?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface BudgetUpdate {
  location_id?: string | null
  category?: string | null
  fiscal_year?: number
  annual_budget?: number
  spent_amount?: number
  notes?: string | null
  updated_at?: string
  deleted_at?: string | null
}

export interface AssetHistoryRow {
  id: string
  asset_id: string | null
  ticket_id: string | null
  maintenance_type: string | null
  description: string | null
  cost: number | null
  performed_by: string | null
  vendor_id: string | null
  performed_at: string
}

export interface AssetHistoryInsert {
  id?: string
  asset_id?: string | null
  ticket_id?: string | null
  maintenance_type?: string | null
  description?: string | null
  cost?: number | null
  performed_by?: string | null
  vendor_id?: string | null
  performed_at?: string
}

export interface OnCallScheduleRow {
  id: string
  tenant_id: string
  location_id: string | null
  user_id: string
  start_date: string
  end_date: string
  is_primary: boolean | null
  notes: string | null
  created_at: string
  deleted_at: string | null
}

export interface OnCallScheduleInsert {
  id?: string
  tenant_id: string
  location_id?: string | null
  user_id: string
  start_date: string
  end_date: string
  is_primary?: boolean | null
  notes?: string | null
  created_at?: string
  deleted_at?: string | null
}

export interface OnCallScheduleUpdate {
  location_id?: string | null
  user_id?: string
  start_date?: string
  end_date?: string
  is_primary?: boolean | null
  notes?: string | null
  deleted_at?: string | null
}

// Extended Database type with additional tables
export type Database = BaseDatabase & {
  public: {
    Tables: BaseDatabase['public']['Tables'] & {
      asset_types: {
        Row: AssetTypeRow
        Insert: AssetTypeInsert
        Update: AssetTypeUpdate
      }
      asset_transfers: {
        Row: AssetTransferRow
        Insert: AssetTransferInsert
        Update: Partial<AssetTransferInsert>
      }
      vendor_ratings: {
        Row: VendorRatingRow
        Insert: VendorRatingInsert
        Update: Partial<VendorRatingInsert>
      }
      compliance_document_types: {
        Row: ComplianceDocumentTypeRow
        Insert: ComplianceDocumentTypeInsert
        Update: Partial<ComplianceDocumentTypeInsert>
      }
      pm_templates: {
        Row: PMTemplateRow
        Insert: PMTemplateInsert
        Update: Partial<PMTemplateInsert>
      }
      compliance_alerts: {
        Row: ComplianceAlertRow
        Insert: ComplianceAlertInsert
        Update: Partial<ComplianceAlertInsert>
      }
      pm_completions: {
        Row: PMCompletionRow
        Insert: PMCompletionInsert
        Update: Partial<PMCompletionInsert>
      }
      compliance_document_versions: {
        Row: ComplianceDocumentVersionRow
        Insert: ComplianceDocumentVersionInsert
        Update: Partial<ComplianceDocumentVersionInsert>
      }
      budgets: {
        Row: BudgetRow
        Insert: BudgetInsert
        Update: BudgetUpdate
      }
      asset_history: {
        Row: AssetHistoryRow
        Insert: AssetHistoryInsert
        Update: Partial<AssetHistoryInsert>
      }
      on_call_schedules: {
        Row: OnCallScheduleRow
        Insert: OnCallScheduleInsert
        Update: OnCallScheduleUpdate
      }
    }
  }
}
