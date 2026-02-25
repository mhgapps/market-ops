/**
 * Theme color tokens
 * CRITICAL: Always use these tokens instead of hex colors or color names
 */

export const theme = {
  // Primary brand colors
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // Main primary
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
    main: "#3b82f6",
    light: "#60a5fa",
    dark: "#1d4ed8",
  },

  // Secondary colors
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b", // Main secondary
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
    main: "#64748b",
    light: "#94a3b8",
    dark: "#334155",
  },

  // Semantic colors
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // Main success
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    main: "#22c55e",
    light: "#4ade80",
    dark: "#15803d",
  },

  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b", // Main warning
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    main: "#f59e0b",
    light: "#fbbf24",
    dark: "#b45309",
  },

  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444", // Main error
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    main: "#ef4444",
    light: "#f87171",
    dark: "#b91c1c",
  },

  info: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4", // Main info
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
    main: "#06b6d4",
    light: "#22d3ee",
    dark: "#0e7490",
  },

  // Neutral/Gray colors
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },

  // Background colors
  background: {
    default: "#ffffff",
    paper: "#f9fafb",
    subtle: "#f3f4f6",
    muted: "#e5e7eb",
  },

  // Text colors
  text: {
    primary: "#111827",
    secondary: "#4b5563",
    muted: "#6b7280",
    disabled: "#9ca3af",
    inverse: "#ffffff",
  },

  // Border colors
  border: {
    default: "#e5e7eb",
    muted: "#d1d5db",
    strong: "#9ca3af",
  },
} as const;

// Ticket priority colors (Linear-inspired)
export const priorityColors = {
  critical: {
    border: "#ef4444",
    bg: "#fef2f2",
    text: "#dc2626",
    dot: "#ef4444",
  },
  high: {
    border: "#f97316",
    bg: "#fff7ed",
    text: "#ea580c",
    dot: "#f97316",
  },
  medium: {
    border: "#3b82f6",
    bg: "#eff6ff",
    text: "#2563eb",
    dot: "#3b82f6",
  },
  low: {
    border: "#6b7280",
    bg: "#f9fafb",
    text: "#4b5563",
    dot: "#9ca3af",
  },
} as const;

// Ticket status colors (Linear-inspired)
export const statusColors = {
  submitted: {
    dot: "#6b7280",
    bg: "#f3f4f6",
    text: "#374151",
    label: "Submitted",
  },
  in_progress: {
    dot: "#8b5cf6",
    bg: "#f5f3ff",
    text: "#6d28d9",
    label: "In Progress",
  },
  completed: {
    dot: "#22c55e",
    bg: "#f0fdf4",
    text: "#15803d",
    label: "Completed",
  },
  closed: {
    dot: "#64748b",
    bg: "#f8fafc",
    text: "#475569",
    label: "Closed",
  },
  rejected: {
    dot: "#ef4444",
    bg: "#fef2f2",
    text: "#dc2626",
    label: "Rejected",
  },
  on_hold: {
    dot: "#f59e0b",
    bg: "#fffbeb",
    text: "#d97706",
    label: "On Hold",
  },
} as const;

// Kanban column colors
export const kanbanColors = {
  columnBg: "#f8fafc",
  cardBg: "#ffffff",
  cardHoverBg: "#fafbfc",
  cardBorder: "#e2e8f0",
  cardShadow: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
  cardHoverShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
  dragOverBg: "#f0f9ff",
} as const;

// Compliance status colors
export const complianceStatusColors = {
  active: theme.success.main,
  expiring_soon: theme.warning.main,
  expired: theme.error.main,
  pending_renewal: theme.info.main,
  conditional: theme.warning[600],
  failed_inspection: theme.error[700],
  suspended: theme.error[800],
} as const;

// Asset status colors
export const assetStatusColors = {
  active: theme.success.main,
  under_maintenance: theme.warning.main,
  retired: theme.gray[500],
  transferred: theme.info.main,
  disposed: theme.error.main,
} as const;

// Budget utilization colors (threshold-based)
export const budgetUtilizationColors = {
  healthy: {
    bg: theme.success[50],
    border: theme.success[200],
    text: theme.success[700],
    bar: theme.success[500],
    label: "Healthy",
  },
  warning: {
    bg: theme.warning[50],
    border: theme.warning[200],
    text: theme.warning[700],
    bar: theme.warning[500],
    label: "Warning",
  },
  danger: {
    bg: "#fff7ed", // Orange-50
    border: "#fed7aa", // Orange-200
    text: "#c2410c", // Orange-700
    bar: "#f97316", // Orange-500
    label: "Danger",
  },
  over: {
    bg: theme.error[50],
    border: theme.error[200],
    text: theme.error[700],
    bar: theme.error[500],
    label: "Over Budget",
  },
} as const;

// Budget category colors for pie charts
export const budgetCategoryColors = [
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#ef4444", // Red
  "#6366f1", // Indigo
] as const;

export type ThemeColors = typeof theme;
