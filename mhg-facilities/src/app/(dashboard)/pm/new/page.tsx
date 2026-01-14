'use client'

import { useRouter } from 'next/navigation'
import { PMScheduleForm } from '@/components/pm/pm-schedule-form'
import { useCreatePMSchedule, usePMTemplates } from '@/hooks/use-pm'
import { useAssets } from '@/hooks/use-assets'
import { useLocations } from '@/hooks/use-locations'
import { useVendors } from '@/hooks/use-vendors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import Link from 'next/link'
import { toast } from 'sonner'
import api from '@/lib/api-client'
import { useQuery } from '@tanstack/react-query'

export default function NewPMSchedulePage() {
  const router = useRouter()
  const createSchedule = useCreatePMSchedule()
  const { data: assetsData, isLoading: assetsLoading } = useAssets()
  const { data: templates, isLoading: templatesLoading } = usePMTemplates()
  const { data: locationsData, isLoading: locationsLoading } = useLocations()
  const { data: vendorsData, isLoading: vendorsLoading } = useVendors({ is_active: true, page: 1, pageSize: 100 })

  // Fetch users for assignment
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get<{ users: Array<{ id: string; full_name: string }> }>('/api/users')
      return response.users
    },
  })

  const isLoading = assetsLoading || templatesLoading || locationsLoading || vendorsLoading || usersLoading

  const assets = assetsData?.data?.map((a: { id: string; name: string; qr_code?: string | null; serial_number?: string | null }) => ({
    id: a.id,
    name: a.name,
    asset_tag: a.qr_code || a.serial_number || 'N/A',
  })) ?? []

  const locations = locationsData?.map((l) => ({
    id: l.id,
    name: l.name,
    address: l.address,
  })) ?? []

  const vendors = vendorsData?.data?.map((v) => ({
    id: v.id,
    name: v.name,
  })) ?? []

  const handleSubmit = async (data: {
    template_id?: string | null
    name: string
    description?: string | null
    target_type: 'asset' | 'location'
    asset_id?: string | null
    location_id?: string | null
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually'
    day_of_week?: number | null
    day_of_month?: number | null
    month_of_year?: number | null
    assigned_to?: string | null
    vendor_id?: string | null
    estimated_cost?: number | null
  }) => {
    try {
      // Remove target_type as it's only used for form UX
      const { target_type, ...submitData } = data

      const schedule = await createSchedule.mutateAsync({
        name: submitData.name,
        description: submitData.description || null,
        template_id: submitData.template_id || null,
        asset_id: submitData.asset_id || null,
        location_id: submitData.location_id || null,
        frequency: submitData.frequency,
        day_of_week: submitData.day_of_week ?? null,
        day_of_month: submitData.day_of_month ?? null,
        month_of_year: submitData.month_of_year ?? null,
        assigned_to: submitData.assigned_to || null,
        vendor_id: submitData.vendor_id || null,
        estimated_cost: submitData.estimated_cost ?? null,
      })
      toast.success('PM Schedule created successfully')
      router.push(`/pm/${schedule.id}`)
    } catch (error) {
      toast.error('Failed to create PM schedule')
    }
  }

  return (
    <div className="space-y-6">
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
          {isLoading ? (
            <PageLoader height="auto" />
          ) : (
            <PMScheduleForm
              assets={assets}
              locations={locations}
              templates={templates ?? []}
              users={usersData ?? []}
              vendors={vendors}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/pm')}
              isSubmitting={createSchedule.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
