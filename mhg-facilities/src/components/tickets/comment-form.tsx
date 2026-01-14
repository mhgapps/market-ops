'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageCircle, Lock } from 'lucide-react'

const commentSchema = z.object({
  comment: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment cannot exceed 5000 characters'),
  is_internal: z.boolean(),
})

type CommentFormValues = z.infer<typeof commentSchema>

interface CommentFormProps {
  ticketId: string
  userRole: 'admin' | 'manager' | 'staff' | 'user'
  onSubmit: (data: { comment: string; is_internal: boolean }) => void | Promise<void>
  placeholder?: string
}

export function CommentForm({
  ticketId,
  userRole,
  onSubmit,
  placeholder = 'Add a comment...',
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canAddInternalComments = ['admin', 'manager', 'staff'].includes(userRole)

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: '',
      is_internal: false,
    },
  })

  const handleSubmit = async (values: CommentFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        comment: values.comment,
        is_internal: values.is_internal,
      })

      form.reset()
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Add Comment
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={placeholder}
                  className="min-h-[100px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Share updates, ask questions, or provide feedback.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {canAddInternalComments && (
          <FormField
            control={form.control}
            name="is_internal"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-amber-200 bg-amber-50 p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-700" />
                    <span className="text-amber-900">Internal Comment</span>
                  </FormLabel>
                  <FormDescription className="text-amber-700">
                    Only visible to staff and management. Not visible to submitter.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <MessageCircle className="h-4 w-4" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
