'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'

const editUserSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['admin', 'manager', 'staff', 'vendor', 'readonly']),
  phone: z.string().optional().or(z.literal('')),
  language_preference: z.enum(['en', 'es']),
  notification_preferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface User {
  id: string
  email: string
  fullName: string
  role: string
  phone?: string
  languagePreference: string
  notificationPreferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

interface EditUserModalProps {
  user: User | null
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function EditUserModal({ user, open, onClose, onSuccess }: EditUserModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    values: user
      ? {
          full_name: user.fullName,
          role: user.role as EditUserFormData['role'],
          phone: user.phone || '',
          language_preference: user.languagePreference as 'en' | 'es',
          notification_preferences: user.notificationPreferences,
        }
      : undefined,
  })

  const selectedRole = watch('role')
  const selectedLanguage = watch('language_preference')
  const notifEmail = watch('notification_preferences.email')
  const notifSms = watch('notification_preferences.sms')
  const notifPush = watch('notification_preferences.push')

  async function onSubmit(data: EditUserFormData) {
    if (!user) return

    setError(null)
    setSubmitting(true)

    try {
      const payload = {
        full_name: data.full_name,
        role: data.role,
        phone: data.phone || undefined,
        language_preference: data.language_preference,
        notification_preferences: data.notification_preferences,
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      handleClose()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    reset()
    setError(null)
    onClose()
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Enter full name"
              disabled={submitting}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setValue('role', value as EditUserFormData['role'])
              }
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="readonly">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="(555) 123-4567"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language Preference</Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) =>
                setValue('language_preference', value as 'en' | 'es')
              }
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Notification Preferences</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif-email" className="font-normal">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="notif-email"
                  checked={notifEmail}
                  onCheckedChange={(checked) =>
                    setValue('notification_preferences.email', checked)
                  }
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif-sms" className="font-normal">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via text message
                  </p>
                </div>
                <Switch
                  id="notif-sms"
                  checked={notifSms}
                  onCheckedChange={(checked) =>
                    setValue('notification_preferences.sms', checked)
                  }
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif-push" className="font-normal">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in the app
                  </p>
                </div>
                <Switch
                  id="notif-push"
                  checked={notifPush}
                  onCheckedChange={(checked) =>
                    setValue('notification_preferences.push', checked)
                  }
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
