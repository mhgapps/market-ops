"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { budgetUtilizationColors } from "@/theme/colors";
import type {
  BudgetSummaryEnriched,
  AlertLevel,
} from "@/services/budget.service";

interface BudgetSummaryCardsProps {
  summary?: BudgetSummaryEnriched;
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getAlertColor(level: AlertLevel) {
  switch (level) {
    case "over":
      return budgetUtilizationColors.over;
    case "danger":
      return budgetUtilizationColors.danger;
    case "warning":
      return budgetUtilizationColors.warning;
    default:
      return budgetUtilizationColors.healthy;
  }
}

export function BudgetSummaryCards({
  summary,
  isLoading,
}: BudgetSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
        <div className="h-20 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const alertColor = getAlertColor(summary.alert_level);
  const isOverBudget = summary.utilization_percentage > 100;
  const remainingIsNegative = summary.total_remaining < 0;

  return (
    <div className="space-y-4">
      {/* Stats Strip */}
      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          {/* Total Budget */}
          <div className="flex flex-col gap-1 hover:bg-accent transition-colors rounded-md p-2">
            <span className="text-sm text-muted-foreground">Total Budget</span>
            <span className="text-xl font-bold">
              {formatCurrency(summary.total_budget)}
            </span>
            <span className="text-xs text-muted-foreground">
              {summary.budget_count} budget
              {summary.budget_count !== 1 ? "s" : ""} active
            </span>
          </div>

          {/* Total Spent */}
          <div
            className={`flex flex-col gap-1 hover:bg-accent transition-colors rounded-md p-2 ${isOverBudget ? "bg-red-50" : ""}`}
          >
            <span className="text-sm text-muted-foreground">Total Spent</span>
            <span
              className={`text-xl font-bold ${isOverBudget ? "text-red-600" : ""}`}
            >
              {formatCurrency(summary.total_spent)}
            </span>
            <div className="flex items-center gap-1">
              {isOverBudget ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <span className="text-xs" style={{ color: alertColor.text }}>
                {summary.utilization_percentage.toFixed(1)}% utilized
              </span>
            </div>
          </div>

          {/* Remaining */}
          <div
            className={`flex flex-col gap-1 hover:bg-accent transition-colors rounded-md p-2 ${remainingIsNegative ? "bg-red-50" : ""}`}
          >
            <span className="text-sm text-muted-foreground">Remaining</span>
            <span
              className="text-xl font-bold"
              style={{
                color: remainingIsNegative
                  ? budgetUtilizationColors.over.text
                  : undefined,
              }}
            >
              {remainingIsNegative ? "-" : ""}
              {formatCurrency(Math.abs(summary.total_remaining))}
            </span>
            {remainingIsNegative && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs">Over budget</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Utilization Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Utilization</span>
            <span
              className="text-sm font-semibold"
              style={{ color: alertColor.text }}
            >
              {summary.utilization_percentage.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={Math.min(summary.utilization_percentage, 100)}
            className="h-3"
            style={{
              // @ts-expect-error CSS variable for progress bar color
              "--progress-foreground": alertColor.bar,
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>
              {summary.warning_count +
                summary.danger_count +
                summary.over_budget_count}{" "}
              budget
              {summary.warning_count +
                summary.danger_count +
                summary.over_budget_count !==
              1
                ? "s"
                : ""}{" "}
              need attention
            </span>
            <span>{summary.over_budget_count} over budget</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
