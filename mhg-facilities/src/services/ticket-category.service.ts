import { TicketCategoryDAO } from '@/dao/ticket-category.dao'
import type { Database } from '@/types/database'

type TicketCategory = Database['public']['Tables']['ticket_categories']['Row']
type TicketPriority = Database['public']['Tables']['ticket_categories']['Row']['default_priority']

export interface CreateCategoryInput {
  name: string
  name_es?: string
  description?: string
  default_priority?: TicketPriority
  default_assignee_id?: string
  preferred_vendor_id?: string
  approval_threshold?: number
  escalation_hours?: number
}

export interface UpdateCategoryInput {
  name?: string
  name_es?: string
  description?: string
  default_priority?: TicketPriority
  default_assignee_id?: string | null
  preferred_vendor_id?: string | null
  approval_threshold?: number | null
  escalation_hours?: number
}

/**
 * Ticket Category Service
 * Handles business logic for ticket categories
 */
export class TicketCategoryService {
  constructor(private categoryDAO = new TicketCategoryDAO()) {}

  /**
   * Get all categories with default assignees and vendors
   */
  async getAllCategories() {
    return this.categoryDAO.findWithDefaults()
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await this.categoryDAO.findByIdWithDefaults(id)
    if (!category) {
      throw new Error('Category not found')
    }
    return category
  }

  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryInput): Promise<TicketCategory> {
    // Validate approval threshold if provided
    if (data.approval_threshold !== undefined && data.approval_threshold !== null && data.approval_threshold < 0) {
      throw new Error('Approval threshold must be a positive number')
    }

    // Validate escalation hours if provided
    if (data.escalation_hours !== undefined && data.escalation_hours < 1) {
      throw new Error('Escalation hours must be at least 1')
    }

    return this.categoryDAO.createCategory(data)
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateCategoryInput): Promise<TicketCategory> {
    // Verify category exists
    await this.getCategoryById(id)

    // Validate approval threshold if provided
    if (data.approval_threshold !== undefined && data.approval_threshold !== null && data.approval_threshold < 0) {
      throw new Error('Approval threshold must be a positive number')
    }

    // Validate escalation hours if provided
    if (data.escalation_hours !== undefined && data.escalation_hours < 1) {
      throw new Error('Escalation hours must be at least 1')
    }

    return this.categoryDAO.updateCategory(id, data)
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: string): Promise<void> {
    // Verify category exists
    await this.getCategoryById(id)

    // TODO: Check if category is in use by any tickets
    // For now, allow deletion regardless

    await this.categoryDAO.softDelete(id)
  }

  /**
   * Get categories by priority level
   */
  async getCategoriesByPriority(priority: TicketPriority) {
    return this.categoryDAO.findByPriority(priority)
  }

  /**
   * Get categories that require cost approval
   */
  async getCategoriesRequiringApproval() {
    return this.categoryDAO.findWithApprovalThreshold()
  }

  /**
   * Check if category requires approval for given cost
   */
  async requiresApproval(categoryId: string, estimatedCost: number): Promise<boolean> {
    const category = await this.getCategoryById(categoryId)

    if (!category.approval_threshold) {
      return false
    }

    return estimatedCost >= category.approval_threshold
  }
}
