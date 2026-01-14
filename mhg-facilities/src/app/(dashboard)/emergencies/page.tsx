'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useEmergencies } from '@/hooks/use-emergencies'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import { format } from 'date-fns'

export default function EmergenciesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Debounce search to avoid filtering on every keystroke
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const filters = useMemo(() =>
    statusFilter !== 'all'
      ? { status: statusFilter as 'active' | 'contained' | 'resolved' }
      : undefined,
    [statusFilter]
  )

  const { data, isLoading } = useEmergencies(filters)

  const stats = data?.stats || { active: 0, resolved_30_days: 0, total_30_days: 0 }

  // Filter incidents by search query with memoization
  const filteredIncidents = useMemo(() => {
    const incidents = data?.incidents || []
    return incidents.filter(
      (incident) =>
        incident.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (incident.description &&
          incident.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
    )
  }, [data?.incidents, debouncedSearch])

  // Separate active and recent (non-active) incidents with memoization
  const activeIncidents = useMemo(() =>
    filteredIncidents.filter((i) => i.status === 'active'),
    [filteredIncidents]
  )
  const recentHistory = useMemo(() =>
    filteredIncidents.filter((i) => i.status !== 'active'),
    [filteredIncidents]
  )

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
            Active
          </Badge>
        )
      case 'contained':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Contained
          </Badge>
        )
      case 'resolved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Emergency Incidents
          </h1>
          <p className="mt-1 text-gray-600">
            Monitor and manage emergency situations across all locations
          </p>
        </div>
        <Button onClick={() => router.push('/emergencies/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Report Emergency
        </Button>
      </div>

      {/* Stats Cards - Compact on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mobile compact layout */}
          <CardContent className="p-3 md:hidden">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground truncate">Active</p>
                <p className="text-base font-bold text-red-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
          {/* Desktop layout */}
          <div className="hidden md:block">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Emergencies
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Requiring immediate attention
              </p>
            </CardContent>
          </div>
        </Card>

        <Card
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        >
          {/* Mobile compact layout */}
          <CardContent className="p-3 md:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground truncate">Resolved</p>
                <p className="text-base font-bold text-green-600">{stats.resolved_30_days}</p>
              </div>
            </div>
          </CardContent>
          {/* Desktop layout */}
          <div className="hidden md:block">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolved (30 Days)
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.resolved_30_days}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully resolved incidents
              </p>
            </CardContent>
          </div>
        </Card>

        <Card
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '200ms', animationFillMode: 'both' }}
        >
          {/* Mobile compact layout */}
          <CardContent className="p-3 md:hidden">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground truncate">Total</p>
                <p className="text-base font-bold">{stats.total_30_days}</p>
              </div>
            </div>
          </CardContent>
          {/* Desktop layout */}
          <div className="hidden md:block">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total (30 Days)
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_30_days}</div>
              <p className="text-xs text-muted-foreground">
                All incidents in past month
              </p>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search emergencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="contained">Contained</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Emergencies Section */}
      {activeIncidents.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Active Emergencies ({activeIncidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeIncidents.map((incident) => (
                <Card
                  key={incident.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/emergencies/${incident.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {incident.title}
                        </h3>
                        {getSeverityBadge(incident.severity)}
                      </div>
                      {incident.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-gray-600">
                          {incident.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Reported{' '}
                        {format(new Date(incident.reported_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Active Emergencies */}
      {activeIncidents.length === 0 && statusFilter === 'all' && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-semibold text-green-800">
                No Active Emergencies
              </h3>
              <p className="text-sm text-green-600">
                All locations are currently operating normally
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent History</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Resolved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No historical incidents found
                </TableCell>
              </TableRow>
            ) : (
              recentHistory.map((incident) => (
                <TableRow
                  key={incident.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/emergencies/${incident.id}`)}
                >
                  <TableCell className="max-w-md">
                    <p className="font-medium">{incident.title}</p>
                    {incident.description && (
                      <p className="line-clamp-1 text-sm text-gray-500">
                        {incident.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                  <TableCell>{getStatusBadge(incident.status)}</TableCell>
                  <TableCell>
                    {format(new Date(incident.reported_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {incident.resolved_at
                      ? format(new Date(incident.resolved_at), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
