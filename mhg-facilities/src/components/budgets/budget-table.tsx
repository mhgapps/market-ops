"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { budgetUtilizationColors } from "@/theme/colors";
import type { BudgetWithSpend, AlertLevel } from "@/services/budget.service";

interface BudgetTableProps {
  budgets?: BudgetWithSpend[];
  isLoading?: boolean;
  onEdit?: (budget: BudgetWithSpend) => void;
  onDelete?: (budget: BudgetWithSpend) => void;
  onView?: (budget: BudgetWithSpend) => void;
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

function AlertBadge({ level }: { level: AlertLevel }) {
  const colors = getAlertColor(level);

  if (level === "none") {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="text-xs"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {colors.label}
    </Badge>
  );
}

function TableSkeleton() {
  return (
    <TableBody>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

export function BudgetTable({
  budgets,
  isLoading,
  onEdit,
  onDelete,
  onView,
}: BudgetTableProps) {
  const router = useRouter();

  const handleView = (budget: BudgetWithSpend) => {
    if (onView) {
      onView(budget);
    } else {
      router.push(`/budgets/${budget.id}`);
    }
  };

  const handleEdit = (budget: BudgetWithSpend) => {
    if (onEdit) {
      onEdit(budget);
    } else {
      router.push(`/budgets/${budget.id}/edit`);
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Spent</TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              Remaining
            </TableHead>
            <TableHead className="w-[120px] md:w-[180px]">
              Utilization
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <TableBody>
            {budgets && budgets.length > 0 ? (
              budgets.map((budget) => {
                const alertColors = getAlertColor(budget.alert_level);
                return (
                  <TableRow
                    key={budget.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(budget)}
                    style={{
                      backgroundColor:
                        budget.alert_level !== "none"
                          ? `${alertColors.bg}40`
                          : undefined,
                    }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span className="capitalize">{budget.category}</span>
                        <AlertBadge level={budget.alert_level} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {budget.location?.name || (
                        <span className="text-muted-foreground text-sm">
                          Tenant-wide
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(budget.annual_budget))}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      style={{ color: alertColors.text }}
                    >
                      {formatCurrency(budget.calculated_spent)}
                    </TableCell>
                    <TableCell
                      className="text-right hidden sm:table-cell"
                      style={{
                        color:
                          budget.remaining < 0
                            ? budgetUtilizationColors.over.text
                            : undefined,
                      }}
                    >
                      {budget.remaining < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(budget.remaining))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(budget.utilization_percentage, 100)}
                          className="h-2 flex-1"
                          style={{
                            // @ts-expect-error CSS variable for progress bar color
                            "--progress-foreground": alertColors.bar,
                          }}
                        />
                        <span
                          className="text-xs font-medium w-12 text-right"
                          style={{ color: alertColors.text }}
                        >
                          {budget.utilization_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(budget);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(budget);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {onDelete && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(budget);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <p className="text-muted-foreground">No budgets found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a budget to start tracking your spending
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
