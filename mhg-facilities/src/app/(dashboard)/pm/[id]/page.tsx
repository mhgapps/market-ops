import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Calendar, Clock, Wrench, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PMDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PMDetailPage({ params }: PMDetailPageProps) {
  const { id } = await params;

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
            <h1 className="text-3xl font-bold tracking-tight">Schedule Details</h1>
            <p className="text-muted-foreground">
              View and manage PM schedule
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/pm/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Suspense fallback={<DetailLoading />}>
        <PMDetail id={id} />
      </Suspense>
    </div>
  );
}

async function PMDetail({ id }: { id: string }) {
  // In real implementation, this would fetch from API
  // For now, showing the structure with placeholder

  // Mock data structure - replace with actual API call
  const schedule = {
    id,
    task_name: 'HVAC Filter Replacement',
    description: 'Replace all HVAC filters in the unit',
    asset_name: 'Rooftop HVAC Unit #1',
    asset_tag: 'HVAC-001',
    frequency: 'monthly',
    frequency_interval: 1,
    priority: 'high' as const,
    next_due_date: '2025-02-15',
    last_completed: '2025-01-15',
    assigned_to_name: 'John Doe',
    estimated_duration_minutes: 60,
    instructions: 'Step-by-step instructions for replacing HVAC filters...',
    parts_needed: 'HVAC Filter 20x25x4 (Qty: 2)',
    estimated_cost: '150.00',
    is_active: true,
  };

  const getPriorityVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'warning' => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <>
      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{schedule.task_name}</CardTitle>
              <CardDescription>{schedule.description || 'No description'}</CardDescription>
            </div>
            <Badge variant={getPriorityVariant(schedule.priority)}>
              {schedule.priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Asset Info */}
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Asset</p>
              <p className="text-sm text-muted-foreground">
                {schedule.asset_name} ({schedule.asset_tag})
              </p>
            </div>
          </div>

          <Separator />

          {/* Schedule Info Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Frequency</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {schedule.frequency.replace('_', ' ')}
                  {schedule.frequency_interval && schedule.frequency_interval > 1
                    ? ` (Every ${schedule.frequency_interval})`
                    : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Next Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(schedule.next_due_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Last Completed</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.last_completed
                    ? new Date(schedule.last_completed).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Assigned To</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.assigned_to_name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Time and Cost */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Estimated Duration</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.estimated_duration_minutes
                    ? `${schedule.estimated_duration_minutes} minutes`
                    : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Estimated Cost</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.estimated_cost
                    ? `$${parseFloat(schedule.estimated_cost).toFixed(2)}`
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {schedule.instructions && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Instructions</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {schedule.instructions}
                </p>
              </div>
            </>
          )}

          {/* Parts Needed */}
          {schedule.parts_needed && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Parts Needed</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {schedule.parts_needed}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Completion History Section - Placeholder for future */}
      <Card>
        <CardHeader>
          <CardTitle>Completion History</CardTitle>
          <CardDescription>Past maintenance task completions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No completion history yet. History tracking coming soon.
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
