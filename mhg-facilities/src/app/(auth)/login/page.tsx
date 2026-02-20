'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

// String constants for bilingual support
const STRINGS = {
  TITLE: 'Welcome back',
  DESCRIPTION: 'Enter your credentials to access your account',
  EMAIL_LABEL: 'Email address',
  EMAIL_PLACEHOLDER: 'you@company.com',
  PASSWORD_LABEL: 'Password',
  PASSWORD_PLACEHOLDER: 'Enter your password',
  FORGOT_PASSWORD: 'Forgot password?',
  SIGN_IN: 'Sign in',
  SIGNING_IN: 'Signing in...',
  SUCCESS: 'Login successful! Redirecting...',
  ERROR_INVALID_EMAIL: 'Please enter a valid email address',
  ERROR_PASSWORD_REQUIRED: 'Password is required',
} as const

// Zod schema for form validation
const loginSchema = z.object({
  email: z.string().email(STRINGS.ERROR_INVALID_EMAIL),
  password: z.string().min(1, STRINGS.ERROR_PASSWORD_REQUIRED),
})

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate with Zod
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === 'email') fieldErrors.email = issue.message
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
      } else {
        toast.success(STRINGS.SUCCESS)
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{STRINGS.TITLE}</CardTitle>
        <CardDescription>{STRINGS.DESCRIPTION}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{STRINGS.EMAIL_LABEL}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={STRINGS.EMAIL_PLACEHOLDER}
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

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
                disabled={isLoading}
                aria-invalid={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
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

        <CardFooter className="flex flex-col gap-4">
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
