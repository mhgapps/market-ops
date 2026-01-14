'use client'

import { useEffect, useState } from 'react'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { User } from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().optional().or(z.literal('')),
  language_preference: z.enum(['en', 'es']),
  notification_preferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
  languagePreference: string
  notificationPreferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue,
    watch,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const selectedLanguage = watch('language_preference')
  const notifEmail = watch('notification_preferences.email')
  const notifSms = watch('notification_preferences.sms')
  const notifPush = watch('notification_preferences.push')

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) throw new Error('Failed to load user')

        const data = await response.json()
        setUser(data.user)

        // Set form values
        setValue('full_name', data.user.fullName || '')
        setValue('phone', data.user.phone || '')
        setValue('language_preference', data.user.languagePreference || 'en')
        setValue('notification_preferences', data.user.notificationPreferences || {
          email: true,
          sms: false,
          push: false,
        })
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [setValue])

  async function onSubmitProfile(data: ProfileFormData) {
    if (!user) return

    setProfileError(null)
    setProfileSuccess(false)
    setSubmitting(true)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.full_name,
          phone: data.phone || undefined,
          language_preference: data.language_preference,
          notification_preferences: data.notification_preferences,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)

      // Reload user data
      const meResponse = await fetch('/api/auth/me')
      const meData = await meResponse.json()
      setUser(meData.user)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  async function onSubmitPassword(_data: PasswordFormData) {
    setPasswordError(null)
    setPasswordSuccess(false)
    setSubmitting(true)

    try {
      // TODO: Implement password change endpoint
      // For now, show a placeholder message
      throw new Error('Password change functionality not yet implemented')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
            {profileError && (
              <Alert variant="destructive">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}

            {profileSuccess && (
              <Alert>
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
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
                {...registerProfile('full_name')}
                placeholder="Enter your full name"
                disabled={submitting}
              />
              {profileErrors.full_name && (
                <p className="text-sm text-destructive">
                  {profileErrors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...registerProfile('phone')}
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

            <Separator />

            <div className="space-y-4">
              <div>
                <Label>Notification Preferences</Label>
                <p className="text-sm text-muted-foreground">
                  Choose how you want to receive notifications
                </p>
              </div>

              <div className="space-y-4">
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

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            {passwordSuccess && (
              <Alert>
                <AlertDescription>Password changed successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                {...registerPassword('current_password')}
                disabled={submitting}
              />
              {passwordErrors.current_password && (
                <p className="text-sm text-destructive">
                  {passwordErrors.current_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                {...registerPassword('new_password')}
                disabled={submitting}
              />
              {passwordErrors.new_password && (
                <p className="text-sm text-destructive">
                  {passwordErrors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                {...registerPassword('confirm_password')}
                disabled={submitting}
              />
              {passwordErrors.confirm_password && (
                <p className="text-sm text-destructive">
                  {passwordErrors.confirm_password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
