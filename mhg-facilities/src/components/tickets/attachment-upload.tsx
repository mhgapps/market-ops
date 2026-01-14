'use client'

import { useState, useRef } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, FileImage, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const attachmentSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) =>
        ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type),
      'Only JPEG, PNG, WebP, and PDF files are allowed'
    ),
  attachment_type: z.enum(['photo', 'invoice', 'quote', 'other']),
})

type AttachmentFormValues = z.infer<typeof attachmentSchema>

interface AttachmentUploadProps {
  ticketId: string
  onUpload: (data: {
    file: File
    attachment_type: 'photo' | 'invoice' | 'quote' | 'other'
  }) => void | Promise<void>
  onCancel?: () => void
}

export function AttachmentUpload({ ticketId, onUpload, onCancel }: AttachmentUploadProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<AttachmentFormValues>({
    resolver: zodResolver(attachmentSchema),
    defaultValues: {
      attachment_type: 'photo',
    },
  })

  const selectedFile = form.watch('file')

  const handleFileChange = (file: File | undefined) => {
    if (!file) {
      setPreview(null)
      return
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (values: AttachmentFormValues) => {
    setIsSubmitting(true)
    try {
      await onUpload({
        file: values.file,
        attachment_type: values.attachment_type,
      })

      form.reset()
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearFile = () => {
    form.setValue('file', null as unknown as File)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload Attachment
        </CardTitle>
        <CardDescription>
          Add photos, invoices, quotes, or other documents to this ticket
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="attachment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select attachment type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="photo">
                        <div className="flex items-center gap-2">
                          <FileImage className="h-4 w-4 text-blue-600" />
                          Photo
                        </div>
                      </SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="other">Other Document</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Categorize this attachment for easier organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          onChange(file)
                          handleFileChange(file)
                        }}
                      />
                      {selectedFile && (
                        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                          <FileImage className="h-4 w-4 text-gray-500" />
                          <span className="flex-1 truncate text-sm text-gray-700">
                            {selectedFile.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFile}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Max file size: 10MB. Accepted formats: JPEG, PNG, WebP, PDF
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Preview */}
            {preview && (
              <div className="rounded-md border border-gray-200 p-2">
                <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>
                <img
                  src={preview}
                  alt="Preview"
                  className={cn(
                    'h-auto w-full rounded-md object-contain',
                    'max-h-[300px]'
                  )}
                />
              </div>
            )}
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
            <Button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="ml-auto gap-2"
            >
              <Upload className="h-4 w-4" />
              {isSubmitting ? 'Uploading...' : 'Upload Attachment'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
