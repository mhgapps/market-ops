"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocationForm } from "@/components/locations/location-form";

export default function NewLocationPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <h1 className="text-2xl md:text-3xl font-bold">Add New Location</h1>
        <p className="text-muted-foreground">
          Create a new facility location for your organization
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
          <CardDescription>
            Enter the information for your new location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationForm
            onSuccess={() => router.push("/settings/locations")}
            onCancel={() => router.push("/settings/locations")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
