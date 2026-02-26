import { Suspense } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Client component for the data display
import { ComplianceList } from "./compliance-list";

export const metadata = {
  title: "Documents",
  description:
    "Manage permits, licenses, insurance, and compliance documentation",
};

export default async function CompliancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Documents</h1>
        <Button asChild>
          <Link href="/compliance/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsLoading />}>
        <StatsCards />
      </Suspense>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>
            View and manage permits, licenses, insurance, and other documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading documents...</div>}>
            <ComplianceList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function StatsCards() {
  // This would fetch from API in real implementation
  // For now, using placeholder data structure
  const stats = {
    total: 0,
    active: 0,
    expiring_soon: 0,
    expired: 0,
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-border">
        <div className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{stats.total}</span>
          <span className="text-sm text-muted-foreground">Total</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-semibold">{stats.active}</span>
          <span className="text-sm text-muted-foreground">Active</span>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors ${stats.expiring_soon > 0 ? "bg-amber-50" : ""}`}
        >
          <Clock
            className={`h-4 w-4 ${stats.expiring_soon > 0 ? "text-amber-600" : "text-muted-foreground"}`}
          />
          <span
            className={`font-semibold ${stats.expiring_soon > 0 ? "text-amber-700" : ""}`}
          >
            {stats.expiring_soon}
          </span>
          <span className="text-sm text-muted-foreground">Expiring Soon</span>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors ${stats.expired > 0 ? "bg-red-50" : ""}`}
        >
          <AlertTriangle
            className={`h-4 w-4 ${stats.expired > 0 ? "text-destructive" : "text-muted-foreground"}`}
          />
          <span
            className={`font-semibold ${stats.expired > 0 ? "text-red-600" : ""}`}
          >
            {stats.expired}
          </span>
          <span className="text-sm text-muted-foreground">Expired</span>
        </div>
      </div>
    </Card>
  );
}

function StatsLoading() {
  return <div className="h-12 rounded-lg bg-muted animate-pulse" />;
}
