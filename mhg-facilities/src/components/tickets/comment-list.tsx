import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, Lock } from 'lucide-react'
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
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center',
          className
        )}
      >
        <MessageCircle className="h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-sm font-medium text-gray-900">No comments yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Be the first to add a comment to this ticket.
        </p>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {comments.map((comment) => {
        const isCurrentUser = currentUserId === comment.user_id
        const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
          addSuffix: true,
        })

        return (
          <Card
            key={comment.id}
            className={cn(
              'transition-shadow hover:shadow-md',
              comment.is_internal && 'border-amber-200 bg-amber-50'
            )}
          >
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    {getInitials(comment.user.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {comment.user.full_name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs font-normal text-gray-500">
                              (You)
                            </span>
                          )}
                        </p>
                        {comment.is_internal && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-amber-300 bg-amber-100 text-amber-800"
                          >
                            <Lock className="h-3 w-3" />
                            Internal
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{comment.user.email}</p>
                    </div>

                    <time
                      className="whitespace-nowrap text-xs text-gray-500"
                      dateTime={comment.created_at}
                      title={format(new Date(comment.created_at), 'PPpp')}
                    >
                      {timeAgo}
                    </time>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
