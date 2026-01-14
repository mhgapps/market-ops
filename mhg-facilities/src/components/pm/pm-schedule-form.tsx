'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Info } from 'lucide-react'
import { Spinner } from '@/components/ui/loaders'

// Schema aligned with backend createPMScheduleSchema
const formSchema = z.object({
  template_id: z.string().nullable().optional(),
  name: z.string().min(1, 'Task name is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  target_type: z.enum(['asset', 'location']),
  asset_id: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually']),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  month_of_year: z.number().int().min(1).max(12).nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  estimated_cost: z.number().positive().nullable().optional(),
}).refine(
  data => {
    if (data.target_type === 'asset') return !!data.asset_id
    if (data.target_type === 'location') return !!data.location_id
    return false
  },
  { message: 'Please select an asset or location', path: ['asset_id'] }
)

type FormValues = z.infer<typeof formSchema>

interface PMScheduleFormProps {
  initialData?: Partial<FormValues>
  onSubmit: (data: FormValues) => void | Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
  assets?: Array<{ id: string; name: string; asset_tag: string }>
  locations?: Array<{ id: string; name: string; address?: string | null }>
  templates?: Array<{
    id: string
    name: string
    description?: string | null
    estimated_duration_hours?: number | null
    default_vendor_id?: string | null
  }>
  users?: Array<{ id: string; full_name: string }>
  vendors?: Array<{ id: string; name: string }>
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function PMScheduleForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
  assets = [],
  locations = [],
  templates = [],
  users = [],
  vendors = [],
}: PMScheduleFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template_id: initialData?.template_id || null,
      name: initialData?.name || '',
      description: initialData?.description || '',
      target_type: initialData?.asset_id ? 'asset' : initialData?.location_id ? 'location' : 'asset',
      asset_id: initialData?.asset_id || null,
      location_id: initialData?.location_id || null,
      frequency: initialData?.frequency || 'monthly',
      day_of_week: initialData?.day_of_week ?? null,
      day_of_month: initialData?.day_of_month ?? null,
      month_of_year: initialData?.month_of_year ?? null,
      assigned_to: initialData?.assigned_to || null,
      vendor_id: initialData?.vendor_id || null,
      estimated_cost: initialData?.estimated_cost || null,
    },
  })

  const targetType = form.watch('target_type')
  const frequency = form.watch('frequency')
  const selectedTemplateId = form.watch('template_id')

  // Auto-fill from template when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (template) {
        if (template.name && !form.getValues('name')) {
          form.setValue('name', template.name)
        }
        if (template.description && !form.getValues('description')) {
          form.setValue('description', template.description)
        }
        if (template.default_vendor_id && !form.getValues('vendor_id')) {
          form.setValue('vendor_id', template.default_vendor_id)
        }
      }
    }
  }, [selectedTemplateId, templates, form])

  // Clear the non-selected target when switching
  useEffect(() => {
    if (targetType === 'asset') {
      form.setValue('location_id', null)
    } else {
      form.setValue('asset_id', null)
    }
  }, [targetType, form])

  // Reset scheduling fields when frequency changes
  useEffect(() => {
    if (frequency === 'daily') {
      form.setValue('day_of_week', null)
      form.setValue('day_of_month', null)
      form.setValue('month_of_year', null)
    } else if (frequency === 'weekly' || frequency === 'biweekly') {
      form.setValue('day_of_month', null)
      form.setValue('month_of_year', null)
    } else if (frequency === 'monthly' || frequency === 'quarterly') {
      form.setValue('day_of_week', null)
      form.setValue('month_of_year', null)
    }
  }, [frequency, form])

  const handleSubmit = (data: FormValues) => {
    // Clean up data before submission
    const cleanData = {
      ...data,
      asset_id: data.target_type === 'asset' ? data.asset_id : null,
      location_id: data.target_type === 'location' ? data.location_id : null,
    }
    onSubmit(cleanData)
  }

  // Determine which scheduling fields to show
  const showDayOfWeek = frequency === 'weekly' || frequency === 'biweekly'
  const showDayOfMonth = frequency === 'monthly' || frequency === 'quarterly' || frequency === 'semi_annually' || frequency === 'annually'
  const showMonthOfYear = frequency === 'semi_annually' || frequency === 'annually'

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Task Details + Template (combined) */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HVAC Filter Replacement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {templates.length > 0 && (
              <FormField
                control={form.control}
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        Use Template
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-fill from template..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">No template</span>
                        </SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of the maintenance task..."
                    className="min-h-[60px] resize-y"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Target + Schedule (combined row) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Target (Asset or Location) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">Target</h4>
            <FormField
              control={form.control}
              name="target_type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-1.5">
                        <RadioGroupItem value="asset" id="target-asset" />
                        <Label htmlFor="target-asset" className="text-sm font-normal cursor-pointer">
                          Asset
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <RadioGroupItem value="location" id="target-location" />
                        <Label htmlFor="target-location" className="text-sm font-normal cursor-pointer">
                          Location
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {targetType === 'asset' && (
              <FormField
                control={form.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              <div className="text-xs text-muted-foreground">{asset.asset_tag}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {targetType === 'location' && (
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div>
                              <div className="font-medium">{location.name}</div>
                              {location.address && (
                                <div className="text-xs text-muted-foreground">{location.address}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">Schedule</h4>
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Frequency *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 grid-cols-2">
              {showDayOfWeek && (
                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Day of Week</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showMonthOfYear && (
                <FormField
                  control={form.control}
                  name="month_of_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Month</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MONTHS.map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showDayOfMonth && (
                <FormField
                  control={form.control}
                  name="day_of_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Day of Month</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="1-31"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </div>

        {/* Assignment & Cost */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">Assignment & Cost</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Assign To</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">Unassigned</span>
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Preferred Vendor</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">No vendor</span>
                      </SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimated_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Est. Cost ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            {mode === 'create' ? 'Create Schedule' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
