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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const assetFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category_id: z.string().uuid('Please select a category').nullish(),
  location_id: z.string().uuid('Please select a location').nullish(),
  serial_number: z.string().max(100).nullish(),
  model: z.string().max(100).nullish(),
  manufacturer: z.string().max(100).nullish(),
  purchase_date: z.string().nullish(),
  purchase_price: z.number().positive('Price must be positive').nullish(),
  warranty_expiration: z.string().nullish(),
  expected_lifespan_years: z.number().int().positive('Lifespan must be positive').nullish(),
  condition_notes: z.string().max(1000).nullish(),
  vendor_id: z.string().uuid().nullish(),
  status: z.enum(['active', 'maintenance', 'retired', 'disposed']),
})

type AssetFormValues = z.infer<typeof assetFormSchema>

interface AssetCategory {
  id: string
  name: string
  description?: string | null
  default_lifespan_years?: number | null
}

interface Location {
  id: string
  name: string
  address?: string | null
}

interface Vendor {
  id: string
  name: string
  service_categories?: string[] | null
}

interface AssetFormProps {
  categories: AssetCategory[]
  locations: Location[]
  vendors: Vendor[]
  defaultValues?: Partial<AssetFormValues>
  onSubmit: (data: AssetFormValues) => void | Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

export function AssetForm({
  categories,
  locations,
  vendors,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
}: AssetFormProps) {
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      category_id: null,
      location_id: null,
      serial_number: null,
      model: null,
      manufacturer: null,
      purchase_date: null,
      purchase_price: null,
      warranty_expiration: null,
      expected_lifespan_years: null,
      condition_notes: null,
      vendor_id: null,
      status: 'active',
      ...defaultValues,
    },
  })

  const selectedCategoryId = form.watch('category_id')
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId)

  // Auto-set lifespan from category default if not already set
  if (selectedCategory?.default_lifespan_years && !form.getValues('expected_lifespan_years')) {
    form.setValue('expected_lifespan_years', selectedCategory.default_lifespan_years)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Add New Asset' : 'Edit Asset'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Register a new asset in the system'
            : 'Update asset information'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., HVAC Unit - Building A"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              {category.description && (
                                <div className="text-xs text-gray-500">
                                  {category.description}
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

              {/* Location */}
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div>
                              <div className="font-medium">{location.name}</div>
                              {location.address && (
                                <div className="text-xs text-gray-500">
                                  {location.address}
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

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="maintenance">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            Maintenance
                          </div>
                        </SelectItem>
                        <SelectItem value="retired">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-500" />
                            Retired
                          </div>
                        </SelectItem>
                        <SelectItem value="disposed">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            Disposed
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Equipment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Equipment Details</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Manufacturer */}
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Carrier" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Model */}
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 24ACC636" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Serial Number */}
                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SN123456789" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Vendor */}
                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor/Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
              </div>
            </div>

            {/* Purchase & Warranty */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Purchase & Warranty</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Purchase Date */}
                <FormField
                  control={form.control}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Purchase Price */}
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
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

                {/* Warranty Expiration */}
                <FormField
                  control={form.control}
                  name="warranty_expiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Expiration</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expected Lifespan */}
                <FormField
                  control={form.control}
                  name="expected_lifespan_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Lifespan (years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={selectedCategory?.default_lifespan_years?.toString() || ''}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      {selectedCategory?.default_lifespan_years && (
                        <FormDescription>
                          Category default: {selectedCategory.default_lifespan_years} years
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Condition Notes */}
            <FormField
              control={form.control}
              name="condition_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes about the asset's condition, known issues, or maintenance history..."
                      className="min-h-[100px] resize-y"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Asset' : 'Update Asset'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
