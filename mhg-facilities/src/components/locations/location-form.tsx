'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUsers } from '@/hooks/use-users'
import api from '@/lib/api-client'

// Form validation schema
const locationFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, 'State must be 2 characters').optional().or(z.literal('')),
  zip: z.string().optional(),
  phone: z.string().optional(),
  square_footage: z.string().optional(),
  manager_id: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'temporarily_closed', 'permanently_closed']),
})

type LocationFormData = z.infer<typeof locationFormSchema>

interface LocationFormProps {
  locationId?: string
  initialData?: Partial<LocationFormData>
  onSuccess?: () => void
  onCancel?: () => void
}

export function LocationForm({
  locationId,
  initialData,
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use the useUsers hook to load users
  const { data: users, isLoading: loadingManagers } = useUsers()

  // Filter users to only managers and admins
  const managers = useMemo(() => {
    return (users || []).filter(
      (u) => u.role === 'manager' || u.role === 'admin'
    )
  }, [users])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zip: initialData?.zip || '',
      phone: initialData?.phone || '',
      square_footage: initialData?.square_footage || '',
      manager_id: initialData?.manager_id || '',
      status: initialData?.status || 'active',
    },
  })

  const selectedManagerId = watch('manager_id')
  const selectedStatus = watch('status')

  async function onSubmit(data: LocationFormData) {
    setError(null)
    setSubmitting(true)

    try {
      // Convert square_footage to number if provided
      const payload = {
        ...data,
        square_footage: data.square_footage ? parseFloat(data.square_footage) : undefined,
        manager_id: data.manager_id || undefined,
        state: data.state || undefined,
      }

      if (locationId) {
        await api.patch(`/api/locations/${locationId}`, payload)
      } else {
        await api.post('/api/locations', payload)
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Name */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">
            Location Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter location name"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="123 Main St"
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register('city')} placeholder="City" />
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            {...register('state')}
            placeholder="CA"
            maxLength={2}
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state.message}</p>
          )}
        </div>

        {/* ZIP */}
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input id="zip" {...register('zip')} placeholder="12345" />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="(555) 123-4567"
            type="tel"
          />
        </div>

        {/* Square Footage */}
        <div className="space-y-2">
          <Label htmlFor="square_footage">Square Footage</Label>
          <Input
            id="square_footage"
            {...register('square_footage')}
            placeholder="5000"
            type="number"
            step="1"
            min="0"
          />
        </div>

        {/* Manager */}
        <div className="space-y-2">
          <Label htmlFor="manager_id">Manager</Label>
          <Select
            value={selectedManagerId || 'none'}
            onValueChange={(value) => setValue('manager_id', value === 'none' ? '' : value)}
            disabled={loadingManagers}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Manager</SelectItem>
              {managers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.fullName} ({manager.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingManagers && (
            <p className="text-sm text-muted-foreground">Loading managers...</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) =>
              setValue('status', value as 'active' | 'temporarily_closed' | 'permanently_closed')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="temporarily_closed">Temporarily Closed</SelectItem>
              <SelectItem value="permanently_closed">Permanently Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting
            ? locationId
              ? 'Saving...'
              : 'Creating...'
            : locationId
            ? 'Save Changes'
            : 'Create Location'}
        </Button>
      </div>
    </form>
  )
}
