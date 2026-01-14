'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function BudgetsPage() {
  const [currentFiscalYear] = useState(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    return month >= 7 ? now.getFullYear() : now.getFullYear() - 1
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage budgets for FY {currentFiscalYear}
          </p>
        </div>
        <Button className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Stats Cards - Compact on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <p className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">
              Total Budget
            </p>
            <div className="text-base md:text-2xl font-bold mt-1">
              <Skeleton className="h-5 md:h-8 w-16 md:w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <p className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">
              Total Spent
            </p>
            <div className="text-base md:text-2xl font-bold mt-1">
              <Skeleton className="h-5 md:h-8 w-16 md:w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <p className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">
              Remaining
            </p>
            <div className="text-base md:text-2xl font-bold mt-1">
              <Skeleton className="h-5 md:h-8 w-16 md:w-32" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budgets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Budget management coming soon</p>
            <p className="text-xs mt-2">
              Create and track budgets by category and location
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
