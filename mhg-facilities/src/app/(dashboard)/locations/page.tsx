'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Plus, Search } from 'lucide-react'

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

export default function LocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created'>('name')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function loadLocations() {
      try {
        // Get user role
        const meResponse = await fetch('/api/auth/me')
        if (meResponse.ok) {
          const meData = await meResponse.json()
          setUserRole(meData.user?.role)
        }

        // Load locations
        const response = await fetch('/api/locations')
        if (!response.ok) throw new Error('Failed to load locations')

        const data = await response.json()
        setLocations(data.locations || [])
        setFilteredLocations(data.locations || [])
      } catch (error) {
        console.error('Error loading locations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [])

  useEffect(() => {
    let filtered = [...locations]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.state?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((loc) => loc.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredLocations(filtered)
  }, [locations, searchQuery, statusFilter, sortBy])

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

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const canManageLocations = userRole === 'admin' || userRole === 'super_admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your facility locations
          </p>
        </div>
        {canManageLocations && (
          <Button onClick={() => router.push('/locations/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="temporarily_closed">Temporarily Closed</SelectItem>
                <SelectItem value="permanently_closed">Permanently Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'created')}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="created">Sort by Date Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Locations List */}
      {filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Locations Found</CardTitle>
            <CardDescription className="text-center mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No locations match your search criteria'
                : 'Get started by adding your first location'}
            </CardDescription>
            {canManageLocations && !searchQuery && statusFilter === 'all' && (
              <Button onClick={() => router.push('/locations/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {location.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {location.address ? (
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div>{location.address}</div>
                              {(location.city || location.state) && (
                                <div className="text-muted-foreground">
                                  {location.city}
                                  {location.city && location.state && ', '}
                                  {location.state} {location.zip}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {location.phone || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(location.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/locations/${location.id}`)}
                          >
                            View
                          </Button>
                          {canManageLocations && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/locations/${location.id}/edit`)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {filteredLocations.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredLocations.length} of {locations.length} location(s)
        </p>
      )}
    </div>
  )
}
