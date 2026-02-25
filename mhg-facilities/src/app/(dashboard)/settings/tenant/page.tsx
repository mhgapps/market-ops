"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Save, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { AUTH_QUERY_KEY } from "@/hooks/use-auth";
import api from "@/lib/api-client";

export default function TenantSettingsPage() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [tenantName, setTenantName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenant?.name) {
      setTenantName(tenant.name);
    }
  }, [tenant?.name]);

  const handleSave = async () => {
    if (!tenantName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setIsSaving(true);
    try {
      await api.patch("/api/tenant", { name: tenantName.trim() });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast.success("Organization name updated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      case "professional":
        return "bg-blue-100 text-blue-800";
      case "starter":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Tenant Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage organization-wide settings (Admin Only)
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900">Admin Access Required</p>
          <p className="text-sm text-amber-700">
            Only administrators can modify tenant settings. Changes affect all
            users in your organization.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Organization Name</Label>
            <Input
              id="tenant-name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="e.g., Acme Corporation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-slug">Organization Slug</Label>
            <Input
              id="tenant-slug"
              value={tenant?.slug ?? ""}
              placeholder="e.g., acme-corp"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Contact support to change your organization slug
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>Current plan and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Plan</Label>
            <div>
              <Badge className={getPlanBadgeColor(tenant?.plan ?? "free")}>
                {(tenant?.plan ?? "free").charAt(0).toUpperCase() +
                  (tenant?.plan ?? "free").slice(1)}{" "}
                Plan
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Max Users</Label>
              <Input
                value={tenant?.limits?.maxUsers ?? 0}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Locations</Label>
              <Input
                value={tenant?.limits?.maxLocations ?? 0}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            To upgrade your plan or adjust limits, contact support or visit the
            billing portal.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || tenantName.trim() === tenant?.name}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
