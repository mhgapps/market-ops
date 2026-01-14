import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileImage,
  FileText,
  Download,
  Trash2,
  Calendar,
  User,
  Paperclip,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type AttachmentType = 'photo' | 'invoice' | 'quote' | 'other'

interface Attachment {
  id: string
  ticket_id: string
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  attachment_type: AttachmentType
  uploaded_by: {
    id: string
    full_name: string
  }
  uploaded_at: string
}

interface AttachmentGalleryProps {
  attachments: Attachment[]
  onDownload?: (attachment: Attachment) => void | Promise<void>
  onDelete?: (attachmentId: string) => void | Promise<void>
  canDelete?: boolean
  className?: string
}

const attachmentTypeConfig: Record<
  AttachmentType,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    badgeClass: string
  }
> = {
  photo: {
    label: 'Photo',
    icon: FileImage,
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  invoice: {
    label: 'Invoice',
    icon: FileText,
    badgeClass: 'bg-green-100 text-green-800',
  },
  quote: {
    label: 'Quote',
    icon: FileText,
    badgeClass: 'bg-purple-100 text-purple-800',
  },
  other: {
    label: 'Document',
    icon: FileText,
    badgeClass: 'bg-gray-100 text-gray-800',
  },
}

export function AttachmentGallery({
  attachments,
  onDownload,
  onDelete,
  canDelete = false,
  className,
}: AttachmentGalleryProps) {
  if (attachments.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center',
          className
        )}
      >
        <Paperclip className="h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-sm font-medium text-gray-900">No attachments</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload photos, invoices, or documents related to this ticket.
        </p>
      </div>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/')
  }

  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {attachments.map((attachment) => {
        const config = attachmentTypeConfig[attachment.attachment_type]
        const Icon = config.icon

        return (
          <Card key={attachment.id} className="overflow-hidden hover:shadow-md">
            <CardContent className="p-0">
              {/* Preview Area */}
              {isImage(attachment.mime_type) ? (
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={attachment.file_path}
                    alt={attachment.file_name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute right-2 top-2">
                    <Badge className={config.badgeClass}>
                      <Icon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-gray-100">
                  <Icon className="h-16 w-16 text-gray-400" />
                  <div className="absolute right-2 top-2">
                    <Badge className={config.badgeClass}>
                      <Icon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Info Area */}
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-sm font-medium text-gray-900">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <User className="h-3 w-3" />
                    {attachment.uploaded_by.full_name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(attachment.uploaded_at), 'MMM d, yyyy')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {onDownload && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => onDownload(attachment)}
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  )}
                  {canDelete && onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(attachment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
