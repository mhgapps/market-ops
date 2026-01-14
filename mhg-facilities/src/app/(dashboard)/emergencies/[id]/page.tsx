'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  useEmergency,
  useUpdateEmergencyStatus,
} from '@/hooks/use-emergencies'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  FileText,
} from 'lucide-react'
import { PageLoader, Spinner } from '@/components/ui/loaders'
import { format } from 'date-fns'
import type { Database } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EmergencyDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [showResolveDialog, setShowResolveDialog] = useState(false)

  const { data: incident, isLoading, error } = useEmergency(id)
  const updateStatus = useUpdateEmergencyStatus(id)

  // Fetch location details
  const { data: locationData } = useQuery({
    queryKey: ['location', incident?.location_id],
    queryFn: async () => {
      if (!incident?.location_id) return null
      const response = await api.get<{
        location: Database['public']['Tables']['locations']['Row']
      }>(`/api/locations/${incident.location_id}`)
      return response.location
    },
    enabled: !!incident?.location_id,
  })

  const handleContain = async () => {
    try {
      await updateStatus.mutateAsync({ action: 'contain' })
      toast.success('Incident marked as contained')
    } catch (error) {
      console.error('Error containing incident:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to contain incident'
      )
    }
  }

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes')
      return
    }

    try {
      await updateStatus.mutateAsync({
        action: 'resolve',
        resolution_notes: resolutionNotes.trim(),
      })
      toast.success('Incident resolved successfully')
      setShowResolveDialog(false)
    } catch (error) {
      console.error('Error resolving incident:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to resolve incident'
      )
    }
  }

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Critical
        </Badge>
      )
    }
    return (
      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
        High
      </Badge>
    )
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case 'contained':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <ShieldAlert className="mr-1 h-3 w-3" />
            Contained
          </Badge>
        )
      case 'resolved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Unknown
          </Badge>
        )
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (error || !incident) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-semibold">Incident Not Found</h2>
            <p className="text-muted-foreground">
              The emergency incident you are looking for does not exist.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/emergencies')}
            >
              Back to Emergencies
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/emergencies')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {incident.title}
              </h1>
              {getSeverityBadge(incident.severity)}
              {getStatusBadge(incident.status)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Reported {format(new Date(incident.reported_at), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons (for active/contained incidents) */}
      {incident.status !== 'resolved' && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-amber-800">
                {incident.status === 'active'
                  ? 'This incident is active and requires attention'
                  : 'This incident is contained but not yet resolved'}
              </h3>
              <p className="text-sm text-amber-700">
                {incident.status === 'active'
                  ? 'Mark as contained once the immediate danger is under control'
                  : 'Resolve the incident once all issues have been addressed'}
              </p>
            </div>
            <div className="flex gap-2">
              {incident.status === 'active' && (
                <Button
                  variant="outline"
                  onClick={handleContain}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <ShieldAlert className="mr-2 h-4 w-4" />
                  )}
                  Mark Contained
                </Button>
              )}
              <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Resolve Incident
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Resolve Incident</DialogTitle>
                    <DialogDescription>
                      Please provide details about how the incident was resolved.
                      This information will be recorded for future reference.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="resolution-notes">Resolution Notes *</Label>
                      <Textarea
                        id="resolution-notes"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Describe how the incident was resolved, any actions taken, and any follow-up required..."
                        rows={5}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowResolveDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleResolve}
                      disabled={updateStatus.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updateStatus.isPending ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      )}
                      Confirm Resolution
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incident Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Incident Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="mt-1 whitespace-pre-wrap">
                {incident.description || 'No description provided'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Severity</Label>
                <div className="mt-1">{getSeverityBadge(incident.severity)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(incident.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationData ? (
              <>
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="mt-1 font-medium">{locationData.name}</p>
                </div>
                {locationData.address && (
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="mt-1">
                      {locationData.address}
                      {locationData.city && `, ${locationData.city}`}
                      {locationData.state && `, ${locationData.state}`}
                      {locationData.zip && ` ${locationData.zip}`}
                    </p>
                  </div>
                )}
                {locationData.emergency_contact_phone && (
                  <div>
                    <Label className="text-muted-foreground">
                      Emergency Contact
                    </Label>
                    <p className="mt-1">{locationData.emergency_contact_phone}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Loading location details...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Reported */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="mt-1 w-px flex-1 bg-gray-200" />
              </div>
              <div className="pb-4">
                <p className="font-medium">Reported</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(incident.reported_at), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>

            {/* Contained */}
            {incident.contained_at && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                    <ShieldAlert className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="mt-1 w-px flex-1 bg-gray-200" />
                </div>
                <div className="pb-4">
                  <p className="font-medium">Contained</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(incident.contained_at), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            )}

            {/* Resolved */}
            {incident.resolved_at && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">Resolved</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(incident.resolved_at), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            )}

            {/* Pending status indicator */}
            {!incident.resolved_at && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-gray-300">
                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    {incident.status === 'active'
                      ? 'Awaiting containment'
                      : 'Awaiting resolution'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolution Notes */}
      {incident.resolution_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Resolution Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{incident.resolution_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
