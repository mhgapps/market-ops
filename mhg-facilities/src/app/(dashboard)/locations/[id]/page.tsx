'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  MapPin,
  Phone,
  User,
  Edit,
  Ticket,
  Package,
  ArrowLeft,
} from 'lucide-react'

interface Location {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  squareFootage?: number
  managerId?: string
  status: 'active' | 'temporarily_closed' | 'permanently_closed'
  createdAt: string
  updatedAt: string
}

interface Manager {
  id: string
  fullName: string
  email: string
  phone?: string
}

interface LocationStats {
  ticketCount: number
  assetCount: number
}

export default function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [manager, setManager] = useState<Manager | null>(null)
  const [stats, setStats] = useState<LocationStats>({ ticketCount: 0, assetCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function loadLocationData() {
      try {
        // Get user role
        const meResponse = await fetch('/api/auth/me')
        if (meResponse.ok) {
          const meData = await meResponse.json()
          setUserRole(meData.user?.role)
        }

        // Load location
        const locationResponse = await fetch(`/api/locations/${resolvedParams.id}`)
        if (!locationResponse.ok) {
          if (locationResponse.status === 404) {
            setError('Location not found')
          } else {
            throw new Error('Failed to load location')
          }
          return
        }

        const locationData = await locationResponse.json()
        setLocation(locationData.location)

        // Load manager if assigned
        if (locationData.location.managerId) {
          const managerResponse = await fetch(`/api/users/${locationData.location.managerId}`)
          if (managerResponse.ok) {
            const managerData = await managerResponse.json()
            setManager(managerData.user)
          }
        }

        // TODO: Load stats when ticket and asset endpoints are available
        // For now, using placeholder stats
        setStats({ ticketCount: 0, assetCount: 0 })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadLocationData()
  }, [resolvedParams.id])

  const getStatusBadge = (status: Location['status']) => {
    const variants = {
      active: 'default',
      temporarily_closed: 'secondary',
      permanently_closed: 'destructive',
    } as const

    const labels = {
      active: 'Active',
      temporarily_closed: 'Temporarily Closed',
      permanently_closed: 'Permanently Closed',
    }

    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const canManageLocations = userRole === 'admin' || userRole === 'super_admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/locations')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Locations
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Location Not Found</CardTitle>
            <CardDescription>{error || 'The location you are looking for does not exist'}</CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/locations')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Locations
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">{location.name}</h1>
            {getStatusBadge(location.status)}
          </div>
        </div>
        {canManageLocations && (
          <Button onClick={() => router.push(`/locations/${location.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Location
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Location Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {location.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                  {(location.city || location.state) && (
                    <p className="text-sm text-muted-foreground">
                      {location.city}
                      {location.city && location.state && ', '}
                      {location.state} {location.zip}
                    </p>
                  )}
                </div>
              </div>
            )}

            {location.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{location.phone}</p>
                </div>
              </div>
            )}

            {location.squareFootage && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Square Footage</p>
                  <p className="text-sm text-muted-foreground">
                    {location.squareFootage.toLocaleString()} sq ft
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            {manager ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{manager.fullName}</p>
                  <p className="text-sm text-muted-foreground">{manager.email}</p>
                </div>
                {manager.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{manager.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No manager assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview of tickets and assets at this location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ticketCount}</p>
                  <p className="text-sm text-muted-foreground">Active Tickets</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.assetCount}</p>
                  <p className="text-sm text-muted-foreground">Assets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
