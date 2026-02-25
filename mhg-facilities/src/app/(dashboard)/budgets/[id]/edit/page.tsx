"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetForm } from "@/components/budgets";
import { toast } from "sonner";
import {
  useBudget,
  useUpdateBudget,
  useFiscalYearOptions,
} from "@/hooks/use-budgets";
import { useLocations } from "@/hooks/use-locations";

export default function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fiscalYearOptions = useFiscalYearOptions();

  const { data: budget, isLoading: budgetLoading } = useBudget(id);
  const { data: locationsData, isLoading: locationsLoading } = useLocations();
  const locations = (locationsData || []).map((loc) => ({
    id: loc.id,
    name: loc.name,
  }));

  const updateBudget = useUpdateBudget();

  const handleSubmit = async (data: {
    category: string;
    location_id?: string | null;
    fiscal_year: number;
    annual_budget: number;
    notes?: string | null;
  }) => {
    try {
      await updateBudget.mutateAsync({ id, data });
      toast.success("Budget updated", {
        description: "The budget has been updated successfully.",
      });
      router.push(`/budgets/${id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update budget";
      toast.error("Error", {
        description: message,
      });
    }
  };

  const isLoading = budgetLoading || locationsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-2xl">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg" />
          </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Budget</h1>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <BudgetForm
          locations={locations}
          fiscalYearOptions={fiscalYearOptions}
          defaultValues={{
            category: budget.category || "",
            location_id: budget.location_id,
            fiscal_year: budget.fiscal_year,
            annual_budget: Number(budget.annual_budget),
            notes: budget.notes,
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={updateBudget.isPending}
          mode="edit"
        />
      </div>
    </div>
  );
}
