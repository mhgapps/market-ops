'use client'

import { useParams, useRouter } from 'next/navigation'
import { PMScheduleForm } from '@/components/pm/pm-schedule-form'
import { usePMSchedule, useUpdatePMSchedule, usePMTemplates } from '@/hooks/use-pm'
import { useAssets } from '@/hooks/use-assets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import api from '@/lib/api-client'
import { useQuery } from '@tanstack/react-query'

export default function EditPMSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = params.id as string

  const { data: schedule, isLoading } = usePMSchedule(scheduleId)
  const updateSchedule = useUpdatePMSchedule()
  const { data: assetsData } = useAssets()
  const { data: templates } = usePMTemplates()

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get<{ users: Array<{ id: string; full_name: string }> }>('/api/users')
      return response.users
    },
  })

  const assets = assetsData?.assets?.map(a => ({
    id: a.id,
    name: a.name,
    asset_tag: a.qr_code || a.serial_number || 'N/A',
  })) ?? []

  const handleSubmit = async (data: {
    asset_id: string
    template_id?: string
    task_name: string
    description?: string
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual'
    frequency_interval?: string
    estimated_duration_minutes?: string
    assigned_to?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    next_due_date: string
    instructions?: string
    parts_needed?: string
    estimated_cost?: string
  }) => {
    try {
      await updateSchedule.mutateAsync({
        id: scheduleId,
        data: {
          name: data.task_name,
          description: data.description || null,
          asset_id: data.asset_id || null,
          template_id: data.template_id || null,
          frequency: data.frequency === 'semi_annual' ? 'semi_annually' : data.frequency === 'annual' ? 'annually' : data.frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually',
          assigned_to: data.assigned_to || null,
          estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : null,
        },
      })
      toast.success('PM Schedule updated successfully')
      router.push(`/pm/${scheduleId}`)
    } catch (error) {
      toast.error('Failed to update PM schedule')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
          The PM schedule you are looking for does not exist or has been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/pm/${scheduleId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit PM Schedule</h1>
          <p className="text-muted-foreground">{schedule.task_name}</p>
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
            initialData={{
              asset_id: schedule.asset_id || '',
              template_id: schedule.template_id || '',
              task_name: schedule.task_name,
              description: schedule.description || '',
              frequency: schedule.frequency,
              frequency_interval: schedule.frequency_interval?.toString() || '',
              estimated_duration_minutes: schedule.estimated_duration_minutes?.toString() || '',
              assigned_to: schedule.assigned_to || '',
              priority: schedule.priority,
              next_due_date: schedule.next_due_date,
              instructions: schedule.instructions || '',
              parts_needed: schedule.parts_needed || '',
              estimated_cost: schedule.estimated_cost?.toString() || '',
            }}
            assets={assets}
            templates={templates ?? []}
            users={usersData ?? []}
            onSubmit={handleSubmit}
            isSubmitting={updateSchedule.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
