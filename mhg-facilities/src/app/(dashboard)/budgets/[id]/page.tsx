"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBudget, useDeleteBudget } from "@/hooks/use-budgets";
import { DeleteBudgetDialog } from "@/components/budgets";
import { budgetUtilizationColors } from "@/theme/colors";
import { useState } from "react";
import type { AlertLevel } from "@/services/budget.service";

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

export default function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: budget, isLoading } = useBudget(id, true);
  const deleteBudget = useDeleteBudget();

  const handleDelete = async () => {
    try {
      await deleteBudget.mutateAsync(id);
      toast.success("Budget deleted", {
        description: "The budget has been deleted successfully.",
      });
      router.push("/budgets");
    } catch {
      toast.error("Error", {
        description: "Failed to delete the budget. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Budget Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The budget you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <Button onClick={() => router.push("/budgets")}>Back to Budgets</Button>
      </div>
    );
  }

  const alertColor = getAlertColor(budget.alert_level);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold capitalize">
              {budget.category}
            </h1>
            <p className="text-muted-foreground">
              {budget.location?.name || "Tenant-wide"} • FY {budget.fiscal_year}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/budgets/${id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Budget Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-xl font-bold">
                  {formatCurrency(Number(budget.annual_budget))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p
                  className="text-xl font-bold"
                  style={{ color: alertColor.text }}
                >
                  {formatCurrency(budget.calculated_spent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p
                  className="text-xl font-bold"
                  style={{
                    color:
                      budget.remaining < 0
                        ? budgetUtilizationColors.over.text
                        : undefined,
                  }}
                >
                  {budget.remaining < 0 ? "-" : ""}
                  {formatCurrency(Math.abs(budget.remaining))}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Utilization</span>
                <div className="flex items-center gap-2">
                  {budget.alert_level !== "none" && (
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: alertColor.bg,
                        borderColor: alertColor.border,
                        color: alertColor.text,
                      }}
                    >
                      {alertColor.label}
                    </Badge>
                  )}
                  <span
                    className="text-sm font-semibold"
                    style={{ color: alertColor.text }}
                  >
                    {budget.utilization_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(budget.utilization_percentage, 100)}
                className="h-3"
                style={{
                  // @ts-expect-error CSS variable for progress bar color
                  "--progress-foreground": alertColor.bar,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{budget.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">
                {budget.location?.name || "Tenant-wide (All Locations)"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fiscal Year</p>
              <p className="font-medium">FY {budget.fiscal_year}</p>
            </div>
            {budget.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{budget.notes}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(budget.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <DeleteBudgetDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        budgetCategory={budget.category ?? undefined}
        onConfirm={handleDelete}
        isDeleting={deleteBudget.isPending}
      />
    </div>
  );
}
