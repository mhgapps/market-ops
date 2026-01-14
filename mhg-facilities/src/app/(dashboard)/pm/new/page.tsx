'use client'

import { useRouter } from 'next/navigation'
import { PMScheduleForm } from '@/components/pm/pm-schedule-form'
import { useCreatePMSchedule, usePMTemplates } from '@/hooks/use-pm'
import { useAssets } from '@/hooks/use-assets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import api from '@/lib/api-client'
import { useQuery } from '@tanstack/react-query'

export default function NewPMSchedulePage() {
  const router = useRouter()
  const createSchedule = useCreatePMSchedule()
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
      const schedule = await createSchedule.mutateAsync({
        name: data.task_name,
        description: data.description || null,
        asset_id: data.asset_id || null,
        template_id: data.template_id || null,
        frequency: data.frequency === 'semi_annual' ? 'semi_annually' : data.frequency === 'annual' ? 'annually' : data.frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually',
        assigned_to: data.assigned_to || null,
        estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : null,
      })
      toast.success('PM Schedule created successfully')
      router.push(`/pm/${schedule.id}`)
    } catch (error) {
      toast.error('Failed to create PM schedule')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add PM Schedule</h1>
          <p className="text-muted-foreground">Create a new preventive maintenance schedule</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Details</CardTitle>
          <CardDescription>
            Define the preventive maintenance task and its schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PMScheduleForm
            assets={assets}
            templates={templates ?? []}
            users={usersData ?? []}
            onSubmit={handleSubmit}
            isSubmitting={createSchedule.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
