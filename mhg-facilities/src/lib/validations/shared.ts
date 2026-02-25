import { z } from "zod";

/**
 * Shared validation utilities
 *
 * UUID validation uses a permissive regex that accepts any properly formatted UUID string
 * (8-4-4-4-12 hex characters). This is more lenient than strict RFC 4122 validation
 * to support seed data that uses simplified UUIDs like '20000000-0000-0000-0000-000000000001'.
 */

// UUID regex that accepts any valid UUID format (including non-RFC 4122 compliant ones used in seed data)
// Standard UUID format: 8-4-4-4-12 hex characters
export const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * UUID string validation - use instead of z.string().uuid() to support non-RFC 4122 UUIDs
 */
export const uuid = (message = "Invalid UUID format") =>
  z.string().regex(uuidRegex, message);

/**
 * Optional UUID that transforms empty strings to undefined
 * Accepts: valid UUID, empty string '', null, undefined
 * Returns: UUID string or undefined (never null or empty string)
 */
export const optionalUuid = z
  .union([
    z.string().regex(uuidRegex, "Invalid UUID format"),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => (val === "" || val === null ? undefined : val));

/**
 * Nullable UUID - accepts UUID or null
 */
export const nullableUuid = (message = "Invalid UUID format") =>
  z.string().regex(uuidRegex, message).nullable();

/**
 * Optional nullable UUID - accepts UUID, null, or undefined
 */
export const optionalNullableUuid = (message = "Invalid UUID format") =>
  z.string().regex(uuidRegex, message).nullable().optional();

/**
 * Array of UUIDs
 */
export const uuidArray = (message = "Invalid UUID format") =>
  z.array(z.string().regex(uuidRegex, message));
