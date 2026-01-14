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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

const vendorFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  contact_name: z.string().max(100).nullish(),
  email: z.string().email('Invalid email').max(100).nullish(),
  phone: z.string().max(20).nullish(),
  emergency_phone: z.string().max(20).nullish(),
  address: z.string().max(500).nullish(),
  service_categories: z.array(z.string()).nullish(),
  is_preferred: z.boolean(),
  contract_start_date: z.string().nullish(),
  contract_expiration: z.string().nullish(),
  insurance_expiration: z.string().nullish(),
  insurance_minimum_required: z.number().positive('Must be positive').nullish(),
  hourly_rate: z.number().positive('Must be positive').nullish(),
  notes: z.string().max(2000).nullish(),
  is_active: z.boolean(),
})

type VendorFormValues = z.infer<typeof vendorFormSchema>

interface VendorFormProps {
  defaultValues?: Partial<VendorFormValues>
  onSubmit: (data: VendorFormValues) => void | Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

const commonServiceCategories = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'Landscaping',
  'Cleaning',
  'Security',
  'IT',
  'Construction',
  'Painting',
  'Pest Control',
]

export function VendorForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
}: VendorFormProps) {
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: '',
      contact_name: null,
      email: null,
      phone: null,
      emergency_phone: null,
      address: null,
      service_categories: [],
      is_preferred: false,
      contract_start_date: null,
      contract_expiration: null,
      insurance_expiration: null,
      insurance_minimum_required: null,
      hourly_rate: null,
      notes: null,
      is_active: true,
      ...defaultValues,
    },
  })

  const serviceCategories = form.watch('service_categories') || []

  const toggleServiceCategory = (category: string) => {
    const current = serviceCategories
    if (current.includes(category)) {
      form.setValue(
        'service_categories',
        current.filter((c) => c !== category)
      )
    } else {
      form.setValue('service_categories', [...current, category])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Add New Vendor' : 'Edit Vendor'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Register a new vendor in the system'
            : 'Update vendor information'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              {/* Vendor Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ABC HVAC Services"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Categories */}
              <FormField
                control={form.control}
                name="service_categories"
                render={() => (
                  <FormItem>
                    <FormLabel>Service Categories</FormLabel>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {commonServiceCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={serviceCategories.includes(category)}
                            onCheckedChange={() => toggleServiceCategory(category)}
                          />
                          <label
                            htmlFor={`category-${category}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormDescription>
                      Select all services this vendor provides
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preferred & Active */}
              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="is_preferred"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          id="is_preferred"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel htmlFor="is_preferred" className="!mt-0">
                        Preferred Vendor
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          id="is_active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel htmlFor="is_active" className="!mt-0">
                        Active
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Contact Name */}
                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@vendor.com"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Emergency Phone */}
                <FormField
                  control={form.control}
                  name="emergency_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 987-6543"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        24/7 emergency contact
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main St, City, State ZIP"
                        className="resize-y"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contract & Insurance */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contract & Insurance</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Contract Start */}
                <FormField
                  control={form.control}
                  name="contract_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contract Expiration */}
                <FormField
                  control={form.control}
                  name="contract_expiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Expiration</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Insurance Expiration */}
                <FormField
                  control={form.control}
                  name="insurance_expiration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Expiration</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Insurance Minimum */}
                <FormField
                  control={form.control}
                  name="insurance_minimum_required"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Minimum ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="1000000"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Minimum insurance coverage required
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hourly Rate */}
                <FormField
                  control={form.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="75.00"
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about the vendor..."
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
                {mode === 'create' ? 'Create Vendor' : 'Update Vendor'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
