'use client'

import { useMemo, useState } from 'react'
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
import { useLocations } from '@/hooks/use-locations'
import { useAuth } from '@/hooks/use-auth'

export default function LocationsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created'>('name')

  // Use React Query hooks for parallel data fetching with caching
  const { data: locations = [], isLoading: locationsLoading } = useLocations()
  const { user, isLoading: authLoading } = useAuth()

  const loading = locationsLoading || authLoading
  const userRole = user?.role ?? null

  // Use useMemo for filtering and sorting instead of useEffect + state
  const filteredLocations = useMemo(() => {
    let result = [...locations]

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.state?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter - map is_active to status concept
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter((loc) => loc.is_active)
      } else if (statusFilter === 'inactive') {
        result = result.filter((loc) => !loc.is_active)
      }
    }

    // Apply sorting
    return result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [locations, searchQuery, statusFilter, sortBy])

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Active' : 'Inactive'}
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
                <SelectItem value="inactive">Inactive</SelectItem>
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
                      <TableCell>{getStatusBadge(location.is_active)}</TableCell>
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
