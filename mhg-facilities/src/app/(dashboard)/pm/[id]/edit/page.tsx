"use client";

import { useParams, useRouter } from "next/navigation";
import { PMScheduleForm } from "@/components/pm/pm-schedule-form";
import {
  usePMSchedule,
  useUpdatePMSchedule,
  usePMTemplates,
} from "@/hooks/use-pm";
import { useAssets } from "@/hooks/use-assets";
import { useLocations } from "@/hooks/use-locations";
import { useVendors } from "@/hooks/use-vendors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export default function EditPMSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;

  const { data: schedule, isLoading: scheduleLoading } =
    usePMSchedule(scheduleId);
  const updateSchedule = useUpdatePMSchedule();
  const { data: assetsData, isLoading: assetsLoading } = useAssets();
  const { data: templates, isLoading: templatesLoading } = usePMTemplates();
  const { data: locationsData, isLoading: locationsLoading } = useLocations();
  const { data: vendorsData, isLoading: vendorsLoading } = useVendors({
    is_active: true,
    page: 1,
    pageSize: 100,
  });

  // Fetch users for assignment
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get<{
        users: Array<{ id: string; full_name: string }>;
      }>("/api/users");
      return response.users;
    },
  });

  const isLoading =
    scheduleLoading ||
    assetsLoading ||
    templatesLoading ||
    locationsLoading ||
    vendorsLoading ||
    usersLoading;

  const assets =
    assetsData?.data?.map(
      (a: {
        id: string;
        name: string;
        qr_code?: string | null;
        serial_number?: string | null;
      }) => ({
        id: a.id,
        name: a.name,
        qr_code: a.qr_code || a.serial_number || "N/A",
      }),
    ) ?? [];

  const locations =
    locationsData?.map((l) => ({
      id: l.id,
      name: l.name,
      address: l.address,
    })) ?? [];

  const vendors =
    vendorsData?.data?.map((v) => ({
      id: v.id,
      name: v.name,
    })) ?? [];

  const handleSubmit = async (data: {
    template_id?: string | null;
    name: string;
    description?: string | null;
    target_type: "asset" | "location";
    asset_id?: string | null;
    location_id?: string | null;
    frequency:
      | "daily"
      | "weekly"
      | "biweekly"
      | "monthly"
      | "quarterly"
      | "semi_annually"
      | "annually";
    day_of_week?: number | null;
    day_of_month?: number | null;
    month_of_year?: number | null;
    assigned_to?: string | null;
    vendor_id?: string | null;
    estimated_cost?: number | null;
  }) => {
    try {
      // Remove target_type as it's only used for form UX
      const { target_type: _target_type, ...submitData } = data;

      await updateSchedule.mutateAsync({
        id: scheduleId,
        data: {
          name: submitData.name,
          description: submitData.description || null,
          template_id: submitData.template_id || null,
          asset_id: submitData.asset_id || null,
          location_id: submitData.location_id || null,
          frequency: submitData.frequency,
          day_of_week: submitData.day_of_week ?? null,
          day_of_month: submitData.day_of_month ?? null,
          month_of_year: submitData.month_of_year ?? null,
          assigned_to: submitData.assigned_to || null,
          vendor_id: submitData.vendor_id || null,
          estimated_cost: submitData.estimated_cost ?? null,
        },
      });
      toast.success("PM Schedule updated successfully");
      router.push(`/pm/${scheduleId}`);
    } catch (_error) {
      toast.error("Failed to update PM schedule");
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!schedule) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pm">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Schedule Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The PM schedule you are looking for does not exist or has been
          deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/pm/${scheduleId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit PM Schedule</h1>
          <p className="text-muted-foreground">{schedule.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Details</CardTitle>
          <CardDescription>
            Update the preventive maintenance schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PMScheduleForm
            mode="edit"
            initialData={{
              template_id: schedule.template_id || null,
              name: schedule.name,
              description: schedule.description || "",
              asset_id: schedule.asset_id || null,
              location_id: schedule.location_id || null,
              frequency: schedule.frequency,
              day_of_week: schedule.day_of_week ?? null,
              day_of_month: schedule.day_of_month ?? null,
              month_of_year: schedule.month_of_year ?? null,
              assigned_to: schedule.assigned_to || null,
              vendor_id: schedule.vendor_id || null,
              estimated_cost: schedule.estimated_cost ?? null,
            }}
            assets={assets}
            locations={locations}
            templates={templates ?? []}
            users={usersData ?? []}
            vendors={vendors}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/pm/${scheduleId}`)}
            isSubmitting={updateSchedule.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
