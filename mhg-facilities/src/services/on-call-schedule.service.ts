import { OnCallScheduleDAO } from "@/dao/on-call-schedule.dao";
import { UserDAO } from "@/dao/user.dao";
import { LocationDAO } from "@/dao/location.dao";
import type { Database } from "@/types/database-extensions";

type OnCallSchedule = Database["public"]["Tables"]["on_call_schedules"]["Row"];
type OnCallScheduleInsert =
  Database["public"]["Tables"]["on_call_schedules"]["Insert"];

export interface CreateScheduleInput {
  user_id: string;
  location_id?: string;
  start_date: string;
  end_date: string;
  is_primary?: boolean;
  notes?: string;
}

export interface UpdateScheduleInput {
  user_id?: string;
  location_id?: string;
  start_date?: string;
  end_date?: string;
  is_primary?: boolean;
  notes?: string;
}

/**
 * On-Call Schedule Service
 * Handles business logic for on-call schedule management
 */
export class OnCallScheduleService {
  constructor(
    private scheduleDAO = new OnCallScheduleDAO(),
    private userDAO = new UserDAO(),
    private locationDAO = new LocationDAO(),
  ) {}

  // ============================================================
  // QUERIES
  // ============================================================

  /**
   * Get all on-call schedules
   */
  async getAllSchedules(): Promise<OnCallSchedule[]> {
    return this.scheduleDAO.findAll();
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(id: string): Promise<OnCallSchedule> {
    const schedule = await this.scheduleDAO.findById(id);
    if (!schedule) {
      throw new Error("On-call schedule not found");
    }
    return schedule;
  }

  /**
   * Get schedules by user
   */
  async getSchedulesByUser(userId: string): Promise<OnCallSchedule[]> {
    return this.scheduleDAO.findByUserId(userId);
  }

  /**
   * Get schedules by location
   */
  async getSchedulesByLocation(locationId: string): Promise<OnCallSchedule[]> {
    return this.scheduleDAO.findByLocation(locationId);
  }

  /**
   * Get schedules within a date range
   */
  async getSchedulesByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<OnCallSchedule[]> {
    return this.scheduleDAO.findByDateRange(startDate, endDate);
  }

  /**
   * Get current on-call person (optionally for a specific location)
   */
  async getCurrentOnCall(locationId?: string): Promise<OnCallSchedule | null> {
    return this.scheduleDAO.findCurrentOnCall(locationId);
  }

  // ============================================================
  // COMMANDS
  // ============================================================

  /**
   * Create a new on-call schedule
   */
  async createSchedule(data: CreateScheduleInput): Promise<OnCallSchedule> {
    // Validate user exists and is eligible for on-call
    const user = await this.userDAO.findById(data.user_id);
    if (!user) {
      throw new Error("User not found");
    }

    // Only staff, managers, and admins can be on-call
    const eligibleRoles = ["staff", "manager", "admin"];
    if (!eligibleRoles.includes(user.role)) {
      throw new Error(
        "Only staff, managers, and admins can be assigned on-call duties",
      );
    }

    // Validate location if provided
    if (data.location_id) {
      const location = await this.locationDAO.findById(data.location_id);
      if (!location) {
        throw new Error("Location not found");
      }
    }

    // Validate date range
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (endDate < startDate) {
      throw new Error("End date must be after start date");
    }

    // Check for overlapping schedules for this user
    const hasOverlap = await this.scheduleDAO.hasOverlap(
      data.user_id,
      data.start_date,
      data.end_date,
    );

    if (hasOverlap) {
      throw new Error(
        "User already has an on-call schedule during this time period",
      );
    }

    // Create the schedule
    return this.scheduleDAO.create({
      user_id: data.user_id,
      location_id: data.location_id ?? null,
      start_date: data.start_date,
      end_date: data.end_date,
      is_primary: data.is_primary ?? true,
      notes: data.notes ?? null,
    } as OnCallScheduleInsert);
  }

  /**
   * Update an existing on-call schedule
   */
  async updateSchedule(
    id: string,
    data: UpdateScheduleInput,
  ): Promise<OnCallSchedule> {
    const existingSchedule = await this.getScheduleById(id);

    // Validate user if being changed
    if (data.user_id && data.user_id !== existingSchedule.user_id) {
      const user = await this.userDAO.findById(data.user_id);
      if (!user) {
        throw new Error("User not found");
      }

      const eligibleRoles = ["staff", "manager", "admin"];
      if (!eligibleRoles.includes(user.role)) {
        throw new Error(
          "Only staff, managers, and admins can be assigned on-call duties",
        );
      }
    }

    // Validate location if being changed
    if (
      data.location_id !== undefined &&
      data.location_id !== existingSchedule.location_id
    ) {
      if (data.location_id) {
        const location = await this.locationDAO.findById(data.location_id);
        if (!location) {
          throw new Error("Location not found");
        }
      }
    }

    // Validate date range if being changed
    const startDate = new Date(data.start_date ?? existingSchedule.start_date);
    const endDate = new Date(data.end_date ?? existingSchedule.end_date);

    if (endDate < startDate) {
      throw new Error("End date must be after start date");
    }

    // Check for overlapping schedules if dates or user changed
    if (data.user_id || data.start_date || data.end_date) {
      const userId = data.user_id ?? existingSchedule.user_id;
      const newStartDate = data.start_date ?? existingSchedule.start_date;
      const newEndDate = data.end_date ?? existingSchedule.end_date;

      const hasOverlap = await this.scheduleDAO.hasOverlap(
        userId,
        newStartDate,
        newEndDate,
        id,
      );

      if (hasOverlap) {
        throw new Error(
          "User already has an on-call schedule during this time period",
        );
      }
    }

    // Update the schedule
    return this.scheduleDAO.update(id, data);
  }

  /**
   * Delete (soft delete) an on-call schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    await this.getScheduleById(id); // Verify exists
    await this.scheduleDAO.softDelete(id);
  }
}
