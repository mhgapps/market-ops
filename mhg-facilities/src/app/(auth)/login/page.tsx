'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { Spinner } from '@/components/ui/loaders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { login } from '../actions'
import api from '@/lib/api-client'

// String constants for bilingual support
const STRINGS = {
  TITLE: 'Welcome back',
  DESCRIPTION_EMAIL: 'Enter your email to continue',
  DESCRIPTION_PASSWORD: 'Signing in as',
  CHANGE: 'change',
  EMAIL_LABEL: 'Email address',
  EMAIL_PLACEHOLDER: 'you@company.com',
  PASSWORD_LABEL: 'Password',
  PASSWORD_PLACEHOLDER: 'Enter your password',
  FORGOT_PASSWORD: 'Forgot password?',
  CONTINUE: 'Continue',
  CHECKING: 'Checking...',
  SIGNING_IN: 'Signing in...',
  SIGNING_YOU_IN: 'Signing you in...',
  SIGN_IN: 'Sign in',
  SUCCESS: 'Login successful! Redirecting...',
  ERROR_INVALID_EMAIL: 'Please enter a valid email address',
  ERROR_PASSWORD_REQUIRED: 'Password is required',
} as const

// Zod schemas for each step
const emailSchema = z.object({
  email: z.string().email(STRINGS.ERROR_INVALID_EMAIL),
})

const passwordSchema = z.object({
  password: z.string().min(1, STRINGS.ERROR_PASSWORD_REQUIRED),
})

type Step = 'email' | 'password' | 'auto-login'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})

    const result = emailSchema.safeParse({ email })
    if (!result.success) {
      const fieldErrors: { email?: string } = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === 'email') fieldErrors.email = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      const { trusted } = await api.post<{ trusted: boolean }>(
        '/api/auth/device-check',
        { email }
      )

      if (trusted) {
        setStep('auto-login')
        try {
          await api.post('/api/auth/device-login', { email })
          toast.success(STRINGS.SUCCESS)
          router.push(redirectTo)
          router.refresh()
        } catch {
          toast.error('Auto-login failed. Please enter your password.')
          setStep('password')
        }
      } else {
        setStep('password')
      }
    } catch {
      // If device-check endpoint fails, fall back to password step
      setStep('password')
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})

    const formData = new FormData(event.currentTarget)
    const password = formData.get('password') as string

    const result = passwordSchema.safeParse({ password })
    if (!result.success) {
      const fieldErrors: { password?: string } = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === 'password') fieldErrors.password = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await login(email, password)

      if (response.error) {
        toast.error(response.error)
        return
      }

      // Trust this device after successful password login
      try {
        await api.post('/api/auth/trust-device', {})
      } catch {
        // Non-critical: device trust failed, continue with login
      }

      // Check if user must set their password
      try {
        const { user } = await api.get<{ user: { must_set_password?: boolean } }>(
          '/api/auth/me'
        )
        if (user?.must_set_password) {
          toast.success(STRINGS.SUCCESS)
          router.push('/set-password')
          router.refresh()
          return
        }
      } catch {
        // Non-critical: /me check failed, continue to dashboard
      }

      toast.success(STRINGS.SUCCESS)
      router.push(redirectTo)
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleChangeEmail() {
    setStep('email')
    setErrors({})
    setShowPassword(false)
  }

  // Auto-login loading state
  if (step === 'auto-login') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{STRINGS.TITLE}</CardTitle>
          <CardDescription>{STRINGS.SIGNING_YOU_IN}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  // Step 1: Email entry
  if (step === 'email') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{STRINGS.TITLE}</CardTitle>
          <CardDescription>{STRINGS.DESCRIPTION_EMAIL}</CardDescription>
        </CardHeader>

        <form onSubmit={handleEmailSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{STRINGS.EMAIL_LABEL}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={STRINGS.EMAIL_PLACEHOLDER}
                autoComplete="email"
                autoFocus
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  {STRINGS.CHECKING}
                </>
              ) : (
                STRINGS.CONTINUE
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  // Step 2: Password entry
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{STRINGS.TITLE}</CardTitle>
        <CardDescription>
          {STRINGS.DESCRIPTION_PASSWORD}{' '}
          <span className="text-foreground font-medium">{email}</span>
          {' '}
          <button
            type="button"
            onClick={handleChangeEmail}
            className="text-primary hover:underline min-h-[44px] min-w-[44px] inline-flex items-center"
          >
            ({STRINGS.CHANGE})
          </button>
        </CardDescription>
      </CardHeader>

      <form onSubmit={handlePasswordSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{STRINGS.PASSWORD_LABEL}</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {STRINGS.FORGOT_PASSWORD}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={STRINGS.PASSWORD_PLACEHOLDER}
                autoComplete="current-password"
                autoFocus
                disabled={isLoading}
                aria-invalid={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" />
                {STRINGS.SIGNING_IN}
              </>
            ) : (
              STRINGS.SIGN_IN
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
