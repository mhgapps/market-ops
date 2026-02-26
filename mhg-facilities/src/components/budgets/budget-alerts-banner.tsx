"use client";

import { AlertTriangle, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { budgetUtilizationColors } from "@/theme/colors";
import type { AlertSummary } from "@/services/budget.service";

interface BudgetAlertsBannerProps {
  alerts?: AlertSummary;
  isLoading?: boolean;
  onViewDetails?: () => void;
}

export function BudgetAlertsBanner({
  alerts,
  isLoading,
  onViewDetails,
}: BudgetAlertsBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed || !alerts) {
    return null;
  }

  const totalAlerts =
    alerts.over_budget.length + alerts.danger.length + alerts.warning.length;

  if (totalAlerts === 0) {
    return null;
  }

  const hasOverBudget = alerts.over_budget.length > 0;
  const hasDanger = alerts.danger.length > 0;

  // Determine severity for banner styling
  const severity = hasOverBudget ? "over" : hasDanger ? "danger" : "warning";
  const colors =
    severity === "over"
      ? budgetUtilizationColors.over
      : severity === "danger"
        ? budgetUtilizationColors.danger
        : budgetUtilizationColors.warning;

  const Icon = hasOverBudget || hasDanger ? AlertCircle : AlertTriangle;

  return (
    <Alert
      className="relative"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <Icon className="h-4 w-4" style={{ color: colors.text }} />
      <AlertTitle className="font-semibold" style={{ color: colors.text }}>
        {hasOverBudget
          ? `${alerts.over_budget.length} Budget${alerts.over_budget.length !== 1 ? "s" : ""} Over Limit`
          : hasDanger
            ? `${alerts.danger.length} Budget${alerts.danger.length !== 1 ? "s" : ""} at Critical Level`
            : `${alerts.warning.length} Budget${alerts.warning.length !== 1 ? "s" : ""} Need Attention`}
      </AlertTitle>
      <AlertDescription className="text-sm" style={{ color: colors.text }}>
        {hasOverBudget && (
          <span>
            {alerts.over_budget
              .slice(0, 3)
              .map((b) => b.category)
              .join(", ")}
            {alerts.over_budget.length > 3 &&
              ` and ${alerts.over_budget.length - 3} more`}{" "}
            exceeded their budget.
          </span>
        )}
        {!hasOverBudget && hasDanger && (
          <span>
            {alerts.danger
              .slice(0, 3)
              .map((b) => b.category)
              .join(", ")}
            {alerts.danger.length > 3 &&
              ` and ${alerts.danger.length - 3} more`}{" "}
            are at 90%+ utilization.
          </span>
        )}
        {!hasOverBudget && !hasDanger && (
          <span>
            {alerts.warning
              .slice(0, 3)
              .map((b) => b.category)
              .join(", ")}
            {alerts.warning.length > 3 &&
              ` and ${alerts.warning.length - 3} more`}{" "}
            are at 80%+ utilization.
          </span>
        )}
        {onViewDetails && (
          <Button
            variant="link"
            size="sm"
            className="px-2 min-h-[40px] ml-1"
            style={{ color: colors.text }}
            onClick={onViewDetails}
          >
            View details
          </Button>
        )}
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-10 w-10"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" style={{ color: colors.text }} />
      </Button>
    </Alert>
  );
}
