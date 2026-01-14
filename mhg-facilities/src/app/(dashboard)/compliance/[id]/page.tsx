import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/compliance/status-badge';
import { ExpirationCountdown } from '@/components/compliance/expiration-countdown';
import { ConditionalBanner } from '@/components/compliance/conditional-banner';
import { FailedInspectionBanner } from '@/components/compliance/failed-inspection-banner';

interface ComplianceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ComplianceDetailPage({ params }: ComplianceDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/compliance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Details</h1>
            <p className="text-muted-foreground">
              View and manage compliance document
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/compliance/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Suspense fallback={<DetailLoading />}>
        <ComplianceDetail id={id} />
      </Suspense>
    </div>
  );
}

async function ComplianceDetail({ id }: { id: string }) {
  // In real implementation, this would fetch from API
  // For now, showing the structure with placeholder

  // Mock data structure - replace with actual API call
  const document: {
    id: string;
    name: string;
    document_type_name: string;
    location_name: string;
    status: 'active' | 'expiring_soon' | 'expired' | 'pending_renewal' | 'conditional' | 'failed_inspection' | 'suspended';
    issue_date: string;
    expiration_date: string;
    issuing_authority: string;
    document_number: string;
    renewal_cost: string;
    notes: string;
    conditional_requirements: string | null;
    conditional_deadline: string | null;
    failed_inspection_date: string | null;
    corrective_action: string | null;
    reinspection_date: string | null;
  } = {
    id,
    name: 'Business License',
    document_type_name: 'License',
    location_name: 'Main Location',
    status: 'active',
    issue_date: '2024-01-01',
    expiration_date: '2025-01-01',
    issuing_authority: 'City of Los Angeles',
    document_number: 'BL-123456',
    renewal_cost: '500.00',
    notes: 'Annual business license renewal',
    conditional_requirements: null,
    conditional_deadline: null,
    failed_inspection_date: null,
    corrective_action: null,
    reinspection_date: null,
  };

  return (
    <>
      {/* Conditional/Failed Inspection Banners */}
      {document.status === 'conditional' && document.conditional_requirements && document.conditional_deadline && (
        <ConditionalBanner
          requirements={document.conditional_requirements}
          deadline={document.conditional_deadline}
        />
      )}

      {document.status === 'failed_inspection' &&
       document.corrective_action &&
       document.reinspection_date &&
       document.failed_inspection_date && (
        <FailedInspectionBanner
          correctiveAction={document.corrective_action}
          reinspectionDate={document.reinspection_date}
          failedDate={document.failed_inspection_date}
        />
      )}

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{document.name}</CardTitle>
              <CardDescription>{document.document_type_name}</CardDescription>
            </div>
            <StatusBadge status={document.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {document.location_name || 'All Locations'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Document Number</p>
                <p className="text-sm text-muted-foreground">
                  {document.document_number || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Issue Date</p>
                <p className="text-sm text-muted-foreground">
                  {document.issue_date ? new Date(document.issue_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Expiration Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(document.expiration_date).toLocaleDateString()}
                </p>
                <ExpirationCountdown expirationDate={document.expiration_date} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Authority and Cost */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium mb-1">Issuing Authority</p>
              <p className="text-sm text-muted-foreground">
                {document.issuing_authority || 'N/A'}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Renewal Cost</p>
                <p className="text-sm text-muted-foreground">
                  {document.renewal_cost ? `$${parseFloat(document.renewal_cost).toFixed(2)}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {document.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {document.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Document Attachments Section - Placeholder for future */}
      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>Document files and related attachments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No attachments yet. Attachment functionality coming soon.
          </p>
        </CardContent>
      </Card>
    </>
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
