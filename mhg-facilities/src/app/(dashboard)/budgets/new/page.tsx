"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetForm } from "@/components/budgets";
import { toast } from "sonner";
import { useCreateBudget, useFiscalYearOptions } from "@/hooks/use-budgets";
import { useLocations } from "@/hooks/use-locations";

export default function NewBudgetPage() {
  const router = useRouter();
  const fiscalYearOptions = useFiscalYearOptions();

  const { data: locationsData, isLoading: locationsLoading } = useLocations();
  const locations = (locationsData || []).map((loc) => ({
    id: loc.id,
    name: loc.name,
  }));

  const createBudget = useCreateBudget();

  const handleSubmit = async (data: {
    category: string;
    location_id?: string | null;
    fiscal_year: number;
    annual_budget: number;
    notes?: string | null;
  }) => {
    try {
      await createBudget.mutateAsync(data);
      toast.success("Budget created", {
        description: `The budget for ${data.category} has been created successfully.`,
      });
      router.push("/budgets");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create budget";
      toast.error("Error", {
        description: message.includes("already exists")
          ? "A budget with this category, location, and fiscal year already exists."
          : message,
      });
    }
  };

  if (locationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Create Budget</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-muted rounded-lg" />
        </div>
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
        <h1 className="text-2xl md:text-3xl font-bold">Create Budget</h1>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <BudgetForm
          locations={locations}
          fiscalYearOptions={fiscalYearOptions}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={createBudget.isPending}
          mode="create"
        />
      </div>
    </div>
  );
}
