"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  Wrench,
  DollarSign,
  User,
  Building,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePMSchedule } from "@/hooks/use-pm";

interface PMDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PMDetailPage({ params }: PMDetailPageProps) {
  const { id } = use(params);
  const { data: schedule, isLoading, error } = usePMSchedule(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/pm">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Schedule Details
              </h1>
            </div>
          </div>
        </div>
        <DetailLoading />
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/pm">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Schedule Details
              </h1>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {error
                ? "Failed to load schedule. Please try again."
                : "Schedule not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusVariant = (isActive: boolean): "default" | "secondary" => {
    return isActive ? "default" : "secondary";
  };

  const formatFrequency = (frequency: string): string => {
    return frequency
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pm">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Schedule Details
            </h1>
          </div>
        </div>
        <Button asChild>
          <Link href={`/pm/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{schedule.name}</CardTitle>
              <CardDescription>
                {schedule.description || "No description"}
              </CardDescription>
            </div>
            <Badge variant={getStatusVariant(schedule.is_active)}>
              {schedule.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Asset/Location Info */}
          {schedule.asset_id && (
            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Asset</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.asset_name || schedule.asset_id}
                </p>
              </div>
            </div>
          )}

          {schedule.location_id && (
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.location_name || schedule.location_id}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Schedule Info Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Frequency</p>
                <p className="text-sm text-muted-foreground">
                  {formatFrequency(schedule.frequency)}
                  {schedule.day_of_week !== null &&
                    ` (Day ${schedule.day_of_week})`}
                  {schedule.day_of_month !== null &&
                    ` (Day ${schedule.day_of_month})`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Next Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.next_due_date
                    ? new Date(schedule.next_due_date).toLocaleDateString()
                    : "Not scheduled"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Last Generated</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.last_generated_at
                    ? new Date(schedule.last_generated_at).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Assigned To</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.assigned_to_name ||
                    schedule.assigned_to ||
                    "Unassigned"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vendor and Cost */}
          <div className="grid gap-4 md:grid-cols-2">
            {schedule.vendor_id && (
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Vendor</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.vendor_name || schedule.vendor_id}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Estimated Cost</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.estimated_cost !== null
                    ? `$${Number(schedule.estimated_cost).toFixed(2)}`
                    : "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Template Info */}
          {schedule.template_id && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Template</p>
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href={`/pm/templates/${schedule.template_id}`}
                      className="hover:underline text-primary"
                    >
                      View Template
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Completion History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Completion History</CardTitle>
          <CardDescription>Past maintenance task completions</CardDescription>
        </CardHeader>
        <CardContent>
          {schedule.completions && schedule.completions.length > 0 ? (
            <div className="space-y-4">
              {schedule.completions.map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">
                        Scheduled:{" "}
                        {new Date(
                          completion.scheduled_date,
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Completed:{" "}
                        {completion.completed_date
                          ? new Date(
                              completion.completed_date,
                            ).toLocaleDateString()
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                  {completion.completed_by && (
                    <p className="text-sm text-muted-foreground">
                      By: {completion.completed_by}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No completion history yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
