'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateEmergency } from '@/hooks/use-emergencies'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { PageLoader, Spinner } from '@/components/ui/loaders'
import type { Database } from '@/types/database'

export default function NewEmergencyPage() {
  const router = useRouter()
  const createEmergency = useCreateEmergency()

  // Form state
  const [locationId, setLocationId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'high' | 'critical'>('high')

  // Fetch locations
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get<{
        locations: Database['public']['Tables']['locations']['Row'][]
      }>('/api/locations')
      return response.locations
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!locationId) {
      toast.error('Please select a location')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    try {
      const incident = await createEmergency.mutateAsync({
        location_id: locationId,
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
      })

      toast.success('Emergency incident reported successfully')
      router.push(`/emergencies/${incident.id}`)
    } catch (error) {
      console.error('Error creating emergency:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to report emergency'
      )
    }
  }

  if (locationsLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/emergencies')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Emergency</h1>
          <p className="mt-1 text-gray-600">
            Submit an emergency incident for immediate attention
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Emergency Reporting</AlertTitle>
        <AlertDescription>
          This form is for reporting urgent facility emergencies that require
          immediate attention. For critical emergencies, on-call staff will be
          notified automatically.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locationsData?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                      {location.address && ` - ${location.address}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={severity}
                onValueChange={(value: 'high' | 'critical') => setSeverity(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      High - Urgent but controlled
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Critical - Immediate action required
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {severity === 'critical' && (
                <p className="text-sm text-red-600">
                  Critical incidents will trigger immediate notifications to
                  on-call staff.
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Water leak in basement, Fire alarm triggered"
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground">
                Provide a brief, clear description of the emergency
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details about the incident, including location specifics, current status, and any immediate actions taken..."
                rows={5}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/emergencies')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEmergency.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {createEmergency.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report Emergency
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
