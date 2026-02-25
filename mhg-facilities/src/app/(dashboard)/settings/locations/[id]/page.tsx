"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Phone,
  User,
  Edit,
  Ticket,
  Package,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "@/hooks/use-locations";
import { useUser } from "@/hooks/use-users";

export default function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  // Use hooks for data fetching
  const { user: authUser } = useAuth();
  const {
    data: location,
    isLoading: locationLoading,
    error: locationError,
  } = useLocation(resolvedParams.id);
  const { data: manager } = useUser(location?.manager_id ?? null);

  const loading = locationLoading;
  const error =
    locationError?.message ??
    (location === null && !locationLoading ? "Location not found" : null);
  const userRole = authUser?.role ?? null;

  // Stats placeholder - TODO: Load from API when available
  const stats = { ticketCount: 0, assetCount: 0 };

  const getStatusBadge = (isActive: boolean | undefined) => {
    if (isActive === undefined) return null;
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const canManageLocations = userRole === "admin" || userRole === "super_admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/settings/locations")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Locations
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Location Not Found</CardTitle>
            <CardDescription>
              {error || "The location you are looking for does not exist"}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings/locations")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Locations
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">{location.name}</h1>
            {getStatusBadge(location.is_active)}
          </div>
        </div>
        {canManageLocations && (
          <Button
            onClick={() =>
              router.push(`/settings/locations/${location.id}/edit`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Location
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Location Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {location.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {location.address}
                  </p>
                  {(location.city || location.state) && (
                    <p className="text-sm text-muted-foreground">
                      {location.city}
                      {location.city && location.state && ", "}
                      {location.state} {location.zip}
                    </p>
                  )}
                </div>
              </div>
            )}

            {location.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {location.phone}
                  </p>
                </div>
              </div>
            )}

            {location.square_footage && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Square Footage</p>
                  <p className="text-sm text-muted-foreground">
                    {location.square_footage.toLocaleString()} sq ft
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            {manager ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{manager.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {manager.email}
                  </p>
                </div>
                {manager.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{manager.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No manager assigned
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Overview of tickets and assets at this location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ticketCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Active Tickets
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.assetCount}</p>
                  <p className="text-sm text-muted-foreground">Assets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
