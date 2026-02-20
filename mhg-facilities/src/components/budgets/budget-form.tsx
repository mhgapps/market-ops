'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/loaders'

// Schema for form
const budgetFormSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  location_id: z.string().nullable().optional(),
  fiscal_year: z.number().int().min(2020).max(2100),
  annual_budget: z.number().positive('Budget must be positive'),
  notes: z.string().max(1000).nullable().optional(),
})

type BudgetFormValues = z.infer<typeof budgetFormSchema>

interface Location {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface BudgetFormProps {
  locations: Location[]
  categories?: Category[]
  fiscalYearOptions: number[]
  defaultValues?: Partial<BudgetFormValues>
  onSubmit: (data: BudgetFormValues) => void | Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

// Common budget categories
const defaultCategories = [
  'Maintenance',
  'Repairs',
  'Equipment',
  'Utilities',
  'Supplies',
  'Cleaning',
  'Security',
  'Landscaping',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Other',
]

export function BudgetForm({
  locations,
  categories,
  fiscalYearOptions,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
}: BudgetFormProps) {
  const currentYear = new Date().getFullYear()

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: '',
      location_id: null,
      fiscal_year: currentYear,
      annual_budget: undefined,
      notes: null,
      ...defaultValues,
    },
  })

  const handleSubmit = async (data: BudgetFormValues) => {
    await onSubmit(data)
  }

  // Use provided categories or defaults
  const categoryOptions = categories?.length
    ? categories.map(c => c.name)
    : defaultCategories

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of expense this budget tracks
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'tenant-wide' ? null : value)}
                    value={field.value || 'tenant-wide'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tenant-wide">
                        Tenant-wide (All Locations)
                      </SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave as &quot;Tenant-wide&quot; for organization-wide budgets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fiscal Year */}
            <FormField
              control={form.control}
              name="fiscal_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscal Year *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fiscal year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fiscalYearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          FY {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Calendar year (January - December)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Annual Budget */}
            <FormField
              control={form.control}
              name="annual_budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Budget *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value ? parseFloat(value) : undefined)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The total budget allocation for this category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              mode === 'create' ? 'Create Budget' : 'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
