"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="p-8 max-w-md">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "An unexpected error occurred while loading the dashboard."}
          </p>
          <Button onClick={reset} className="w-full">
            Retry
          </Button>
        </div>
      </Card>
    </div>
  );
}
