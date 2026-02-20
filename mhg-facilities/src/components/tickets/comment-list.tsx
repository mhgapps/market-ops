import { MessageCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  ticket_id: string
  user_id: string
  user: {
    id: string
    full_name: string
    email: string
  }
  comment: string
  is_internal: boolean
  created_at: string
}

interface CommentListProps {
  comments: Comment[]
  currentUserId?: string
  className?: string
}

export function CommentList({ comments, currentUserId, className }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-6 text-center',
          className
        )}
      >
        <MessageCircle className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">No comments yet</p>
      </div>
    )
  }

  return (
    <div className={cn('divide-y divide-gray-100', className)}>
      {comments.map((comment) => {
        const isCurrentUser = currentUserId === comment.user_id
        const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
          addSuffix: true,
        })

        return (
          <div key={comment.id} className="py-2.5 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">
                {comment.user.full_name}
                {isCurrentUser && (
                  <span className="ml-1 text-xs font-normal text-gray-500">(You)</span>
                )}
              </p>
              <time
                className="whitespace-nowrap text-xs text-gray-400"
                dateTime={comment.created_at}
                title={format(new Date(comment.created_at), 'PPpp')}
              >
                {timeAgo}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-600 mt-0.5">
              {comment.comment}
            </p>
          </div>
        )
      })}
    </div>
  )
}
