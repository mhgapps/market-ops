'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { AlertLevel } from '@/services/budget.service'

interface Location {
  id: string
  name: string
}

interface BudgetFiltersProps {
  fiscalYear: number
  fiscalYearOptions: number[]
  onFiscalYearChange: (year: number) => void
  locationId?: string
  locations?: Location[]
  onLocationChange?: (locationId: string | undefined) => void
  alertLevel?: AlertLevel | 'all'
  onAlertLevelChange?: (level: AlertLevel | 'all') => void
  onClearFilters?: () => void
}

export function BudgetFilters({
  fiscalYear,
  fiscalYearOptions,
  onFiscalYearChange,
  locationId,
  locations = [],
  onLocationChange,
  alertLevel,
  onAlertLevelChange,
  onClearFilters,
}: BudgetFiltersProps) {
  const hasActiveFilters = locationId || (alertLevel && alertLevel !== 'all')

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      {/* Fiscal Year */}
      <Select
        value={fiscalYear.toString()}
        onValueChange={(value) => onFiscalYearChange(parseInt(value))}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Fiscal Year" />
        </SelectTrigger>
        <SelectContent>
          {fiscalYearOptions.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              FY {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Location Filter */}
      {onLocationChange && locations.length > 0 && (
        <Select
          value={locationId || 'all'}
          onValueChange={(value) => onLocationChange(value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="tenant-wide">Tenant-wide Only</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Alert Level Filter */}
      {onAlertLevelChange && (
        <Select
          value={alertLevel || 'all'}
          onValueChange={(value) => onAlertLevelChange(value as AlertLevel | 'all')}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="none">Healthy</SelectItem>
            <SelectItem value="warning">Warning (80%+)</SelectItem>
            <SelectItem value="danger">Danger (90%+)</SelectItem>
            <SelectItem value="over">Over Budget</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
