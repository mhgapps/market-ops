import { VendorDAO, type VendorFilters } from "@/dao/vendor.dao";

// Re-export types for consumers
export type { VendorFilters, PaginatedResult } from "@/dao/vendor.dao";
import type { Database } from "@/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type VendorInsert = Database["public"]["Tables"]["vendors"]["Insert"];
type VendorUpdate = Database["public"]["Tables"]["vendors"]["Update"];

export interface CreateVendorDTO {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  emergency_phone?: string;
  address?: string;
  service_categories?: string[];
  is_preferred?: boolean;
  contract_start_date?: string;
  contract_expiration?: string;
  insurance_expiration?: string;
  insurance_minimum_required?: number;
  hourly_rate?: number;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateVendorDTO {
  name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  emergency_phone?: string;
  address?: string;
  service_categories?: string[];
  is_preferred?: boolean;
  contract_start_date?: string;
  contract_expiration?: string;
  insurance_expiration?: string;
  insurance_minimum_required?: number;
  hourly_rate?: number;
  notes?: string;
  is_active?: boolean;
}

/**
 * Service for managing vendors
 * Handles vendor CRUD, insurance/contract tracking, preferred vendor management
 */
export class VendorService {
  constructor(private vendorDAO = new VendorDAO()) {}

  /**
   * Get all vendors with optional filters
   */
  async getAllVendors(filters?: VendorFilters): Promise<Vendor[]> {
    if (filters) {
      return this.vendorDAO.findWithFilters(filters);
    }
    return this.vendorDAO.findAll();
  }

  /**
   * Get all vendors with pagination
   * Returns paginated results with total count
   * @param filters Optional filters including page and pageSize
   */
  async getAllVendorsPaginated(filters?: VendorFilters) {
    return this.vendorDAO.findWithFiltersPaginated(filters);
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(id: string): Promise<Vendor | null> {
    return this.vendorDAO.findById(id);
  }

  /**
   * Get active vendors
   */
  async getActiveVendors(): Promise<Vendor[]> {
    return this.vendorDAO.findActive();
  }

  /**
   * Get preferred vendors
   */
  async getPreferredVendors(): Promise<Vendor[]> {
    return this.vendorDAO.findPreferred();
  }

  /**
   * Get vendors by service category
   */
  async getVendorsByServiceCategory(category: string): Promise<Vendor[]> {
    return this.vendorDAO.findByServiceCategory(category);
  }

  /**
   * Search vendors
   */
  async searchVendors(query: string): Promise<Vendor[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.vendorDAO.search(query.trim());
  }

  /**
   * Get vendors with expiring insurance
   */
  async getVendorsWithExpiringInsurance(daysAhead = 30): Promise<Vendor[]> {
    return this.vendorDAO.findInsuranceExpiring(daysAhead);
  }

  /**
   * Get vendors with expiring contracts
   */
  async getVendorsWithExpiringContracts(daysAhead = 30): Promise<Vendor[]> {
    return this.vendorDAO.findContractExpiring(daysAhead);
  }

  /**
   * Create new vendor
   */
  async createVendor(data: CreateVendorDTO): Promise<Vendor> {
    // Check for duplicate name
    const existing = await this.vendorDAO.findByName(data.name);
    if (existing) {
      throw new Error("Vendor with this name already exists");
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    // Validate dates
    if (data.contract_start_date && data.contract_expiration) {
      if (
        new Date(data.contract_start_date) > new Date(data.contract_expiration)
      ) {
        throw new Error("Contract start date cannot be after expiration date");
      }
    }

    const insertData: Partial<VendorInsert> = {
      name: data.name,
      contact_name: data.contact_name ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      emergency_phone: data.emergency_phone ?? null,
      address: data.address ?? null,
      service_categories: data.service_categories ?? undefined,
      is_preferred: data.is_preferred ?? false,
      contract_start_date: data.contract_start_date ?? null,
      contract_expiration: data.contract_expiration ?? null,
      insurance_expiration: data.insurance_expiration ?? null,
      insurance_minimum_required: data.insurance_minimum_required ?? null,
      hourly_rate: data.hourly_rate ?? null,
      notes: data.notes ?? null,
      is_active: data.is_active ?? true,
    };

    return this.vendorDAO.create(insertData);
  }

  /**
   * Update vendor
   */
  async updateVendor(id: string, data: UpdateVendorDTO): Promise<Vendor> {
    // Verify vendor exists
    const vendor = await this.vendorDAO.findById(id);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Check for duplicate name if changing
    if (data.name && data.name !== vendor.name) {
      const existing = await this.vendorDAO.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new Error("Vendor with this name already exists");
      }
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error("Invalid email format");
    }

    // Validate dates if both provided
    const startDate = data.contract_start_date ?? vendor.contract_start_date;
    const endDate = data.contract_expiration ?? vendor.contract_expiration;

    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error("Contract start date cannot be after expiration date");
      }
    }

    const updateData: Partial<VendorUpdate> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.contact_name !== undefined)
      updateData.contact_name = data.contact_name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.emergency_phone !== undefined)
      updateData.emergency_phone = data.emergency_phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.service_categories !== undefined)
      updateData.service_categories = data.service_categories;
    if (data.is_preferred !== undefined)
      updateData.is_preferred = data.is_preferred;
    if (data.contract_start_date !== undefined)
      updateData.contract_start_date = data.contract_start_date;
    if (data.contract_expiration !== undefined)
      updateData.contract_expiration = data.contract_expiration;
    if (data.insurance_expiration !== undefined)
      updateData.insurance_expiration = data.insurance_expiration;
    if (data.insurance_minimum_required !== undefined)
      updateData.insurance_minimum_required = data.insurance_minimum_required;
    if (data.hourly_rate !== undefined)
      updateData.hourly_rate = data.hourly_rate;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    return this.vendorDAO.update(id, updateData);
  }

  /**
   * Delete vendor (soft delete)
   */
  async deleteVendor(id: string): Promise<void> {
    // Verify vendor exists
    const vendor = await this.vendorDAO.findById(id);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // TODO: Check if vendor has active tickets or assets
    // This will be implemented once ticket/asset integration is added

    await this.vendorDAO.softDelete(id);
  }

  /**
   * Activate vendor
   */
  async activateVendor(id: string): Promise<Vendor> {
    const vendor = await this.vendorDAO.findById(id);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    return this.vendorDAO.update(id, { is_active: true });
  }

  /**
   * Deactivate vendor
   */
  async deactivateVendor(id: string): Promise<Vendor> {
    const vendor = await this.vendorDAO.findById(id);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    return this.vendorDAO.update(id, { is_active: false });
  }

  /**
   * Set vendor as preferred
   */
  async setPreferred(id: string, isPreferred: boolean): Promise<Vendor> {
    const vendor = await this.vendorDAO.findById(id);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    return this.vendorDAO.update(id, { is_preferred: isPreferred });
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(): Promise<VendorStats> {
    return this.vendorDAO.getStats();
  }

  /**
   * Check insurance status for vendor
   */
  async checkInsuranceStatus(id: string): Promise<InsuranceStatus> {
    const vendor = await this.vendorDAO.findById(id);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (!vendor.insurance_expiration) {
      return {
        has_insurance: false,
        is_expired: false,
        expires_soon: false,
        days_remaining: null,
        expiration_date: null,
        meets_minimum: vendor.insurance_minimum_required === null,
      };
    }

    const expirationDate = new Date(vendor.insurance_expiration);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      has_insurance: true,
      is_expired: daysRemaining < 0,
      expires_soon: daysRemaining > 0 && daysRemaining <= 30,
      days_remaining: daysRemaining,
      expiration_date: vendor.insurance_expiration,
      meets_minimum: true, // Assuming verified at creation
    };
  }

  /**
   * Check contract status for vendor
   */
  async checkContractStatus(id: string): Promise<ContractStatus> {
    const vendor = await this.vendorDAO.findById(id);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (!vendor.contract_expiration) {
      return {
        has_contract: false,
        is_expired: false,
        expires_soon: false,
        days_remaining: null,
        start_date: vendor.contract_start_date,
        expiration_date: null,
      };
    }

    const expirationDate = new Date(vendor.contract_expiration);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      has_contract: true,
      is_expired: daysRemaining < 0,
      expires_soon: daysRemaining > 0 && daysRemaining <= 30,
      days_remaining: daysRemaining,
      start_date: vendor.contract_start_date,
      expiration_date: vendor.contract_expiration,
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export interface VendorStats {
  total: number;
  active: number;
  inactive: number;
  preferred: number;
  insurance_expiring_30_days: number;
  contract_expiring_30_days: number;
}

export interface InsuranceStatus {
  has_insurance: boolean;
  is_expired: boolean;
  expires_soon: boolean;
  days_remaining: number | null;
  expiration_date: string | null;
  meets_minimum: boolean;
}

export interface ContractStatus {
  has_contract: boolean;
  is_expired: boolean;
  expires_soon: boolean;
  days_remaining: number | null;
  start_date: string | null;
  expiration_date: string | null;
}
