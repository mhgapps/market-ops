'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useAssets } from '@/hooks/use-assets'
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
import { Plus, Search, QrCode, MapPin } from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import type { Database } from '@/types/database'

export default function AssetsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Debounce search to avoid API calls on every keystroke
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const filters = useMemo(() => ({
    ...(statusFilter !== 'all' && { status: statusFilter as 'active' | 'under_maintenance' | 'retired' | 'transferred' | 'disposed' }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    pageSize,
  }), [statusFilter, debouncedSearch, page, pageSize])

  const { data, isLoading } = useAssets(filters)
  const assets = data?.data || []
  const totalCount = data?.total ?? 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'under_maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'retired':
        return 'bg-gray-100 text-gray-800'
      case 'transferred':
        return 'bg-blue-100 text-blue-800'
      case 'disposed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Assets</h1>
          <p className="mt-1 text-sm text-gray-600 md:text-base">
            Manage equipment and facility assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/assets/scan')}
          >
            <QrCode className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Scan QR</span>
          </Button>
          <Button onClick={() => router.push('/assets/new')}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Asset</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search by name, model, serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Assets ({totalCount})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No assets found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/assets/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Asset
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden sm:table-cell">Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">QR Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(assets as unknown as Array<Database['public']['Tables']['assets']['Row'] & {
                    location?: { name: string } | null
                    category?: { name: string } | null
                  }>).map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/assets/${asset.id}`)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          {asset.model && (
                            <div className="text-sm text-gray-500">
                              {asset.manufacturer && `${asset.manufacturer} `}
                              {asset.model}
                            </div>
                          )}
                          {asset.serial_number && (
                            <div className="text-xs text-gray-500 md:hidden">
                              SN: {asset.serial_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {asset.category?.name || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          {asset.location?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {asset.qr_code && (
                          <code className="text-xs font-mono">{asset.qr_code}</code>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/assets/${asset.id}`)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * pageSize >= totalCount}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
