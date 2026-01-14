'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { DollarSign, Upload } from 'lucide-react'

const costApprovalSchema = z.object({
  estimated_cost: z
    .number()
    .positive('Estimated cost must be greater than 0')
    .max(1000000, 'Estimated cost cannot exceed $1,000,000'),
  vendor_quote: z.instanceof(File).optional(),
  notes: z.string().min(10, 'Please provide details about the cost estimate').max(1000),
})

type CostApprovalFormValues = z.infer<typeof costApprovalSchema>

interface CostApprovalFormProps {
  ticketId: string
  ticketTitle: string
  onSubmit: (data: {
    estimated_cost: number
    vendor_quote_path?: string
    notes: string
  }) => void | Promise<void>
  onCancel?: () => void
}

export function CostApprovalForm({
  ticketId,
  ticketTitle,
  onSubmit,
  onCancel,
}: CostApprovalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const form = useForm<CostApprovalFormValues>({
    resolver: zodResolver(costApprovalSchema),
    defaultValues: {
      estimated_cost: 0,
      notes: '',
    },
  })

  const handleSubmit = async (values: CostApprovalFormValues) => {
    setIsSubmitting(true)
    try {
      // In a real implementation, you'd upload the file first and get the path
      let vendorQuotePath: string | undefined

      if (values.vendor_quote) {
        // TODO: Implement file upload to Supabase storage
        // For now, we'll just use the filename
        vendorQuotePath = `quotes/${ticketId}/${values.vendor_quote.name}`
      }

      await onSubmit({
        estimated_cost: values.estimated_cost,
        vendor_quote_path: vendorQuotePath,
        notes: values.notes,
      })

      form.reset()
      setUploadedFileName(null)
    } catch (error) {
      console.error('Error submitting cost approval:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Request Cost Approval
        </CardTitle>
        <CardDescription>
          Submit a cost estimate for approval for ticket: <strong>{ticketTitle}</strong>
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="estimated_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Cost ($)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the estimated cost for this work
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor_quote"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Vendor Quote (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            onChange(file)
                            setUploadedFileName(file.name)
                          }
                        }}
                        {...field}
                      />
                      <Upload className="h-4 w-4 text-gray-500" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Attach a vendor quote or estimate document (PDF, PNG, JPG)
                  </FormDescription>
                  {uploadedFileName && (
                    <p className="text-sm text-green-600">Attached: {uploadedFileName}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Details & Justification</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about the cost estimate, including breakdown of materials, labor, and any other relevant information..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain what the cost covers and why it&apos;s necessary
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
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
            <Button type="submit" disabled={isSubmitting} className="ml-auto">
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
