import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, FileText, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Client component for the data display
import { ComplianceList } from './compliance-list';

export const metadata = {
  title: 'Compliance Documents',
  description: 'Manage permits, licenses, and compliance documentation',
};

export default async function CompliancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Documents</h1>
          <p className="text-muted-foreground">
            Track permits, licenses, and regulatory compliance
          </p>
        </div>
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
            View and manage all compliance documents
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
    <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
      <Card>
        {/* Mobile compact layout */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">Total</p>
              <p className="text-base font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
        {/* Desktop layout */}
        <div className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </div>
      </Card>

      <Card>
        {/* Mobile compact layout */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">Active</p>
              <p className="text-base font-bold">{stats.active}</p>
            </div>
          </div>
        </CardContent>
        {/* Desktop layout */}
        <div className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </div>
      </Card>

      <Card>
        {/* Mobile compact layout */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">Expiring</p>
              <p className="text-base font-bold">{stats.expiring_soon}</p>
            </div>
          </div>
        </CardContent>
        {/* Desktop layout */}
        <div className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiring_soon}</div>
          </CardContent>
        </div>
      </Card>

      <Card>
        {/* Mobile compact layout */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">Expired</p>
              <p className="text-base font-bold">{stats.expired}</p>
            </div>
          </div>
        </CardContent>
        {/* Desktop layout */}
        <div className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 md:h-28 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
