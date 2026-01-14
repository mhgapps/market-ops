'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'

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
import { signup } from '../actions'

// String constants for bilingual support
const STRINGS = {
  TITLE: 'Create an account',
  DESCRIPTION: 'Start managing your facilities today',
  TENANT_NAME_LABEL: 'Company name',
  TENANT_NAME_PLACEHOLDER: 'Your company name',
  FULL_NAME_LABEL: 'Full name',
  FULL_NAME_PLACEHOLDER: 'John Doe',
  EMAIL_LABEL: 'Email address',
  EMAIL_PLACEHOLDER: 'you@company.com',
  PASSWORD_LABEL: 'Password',
  PASSWORD_PLACEHOLDER: 'Create a strong password',
  CONFIRM_PASSWORD_LABEL: 'Confirm password',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Confirm your password',
  CREATE_ACCOUNT: 'Create account',
  CREATING_ACCOUNT: 'Creating account...',
  HAVE_ACCOUNT: 'Already have an account?',
  SIGN_IN: 'Sign in',
  SUCCESS: 'Account created! Please check your email to verify your account.',
  ERROR_TENANT_NAME_REQUIRED: 'Company name is required',
  ERROR_TENANT_NAME_MIN: 'Company name must be at least 2 characters',
  ERROR_FULL_NAME_REQUIRED: 'Full name is required',
  ERROR_FULL_NAME_MIN: 'Full name must be at least 2 characters',
  ERROR_INVALID_EMAIL: 'Please enter a valid email address',
  ERROR_PASSWORD_MIN: 'Password must be at least 8 characters',
  ERROR_PASSWORD_WEAK: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  ERROR_PASSWORDS_DONT_MATCH: 'Passwords do not match',
} as const

// Zod schema for form validation
const signupSchema = z.object({
  tenantName: z
    .string()
    .min(1, STRINGS.ERROR_TENANT_NAME_REQUIRED)
    .min(2, STRINGS.ERROR_TENANT_NAME_MIN),
  fullName: z
    .string()
    .min(1, STRINGS.ERROR_FULL_NAME_REQUIRED)
    .min(2, STRINGS.ERROR_FULL_NAME_MIN),
  email: z.string().email(STRINGS.ERROR_INVALID_EMAIL),
  password: z
    .string()
    .min(8, STRINGS.ERROR_PASSWORD_MIN)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, STRINGS.ERROR_PASSWORD_WEAK),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: STRINGS.ERROR_PASSWORDS_DONT_MATCH,
  path: ['confirmPassword'],
})

type FormErrors = {
  tenantName?: string
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})

    const formData = new FormData(event.currentTarget)
    const tenantName = formData.get('tenantName') as string
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Validate with Zod
    const result = signupSchema.safeParse({
      tenantName,
      fullName,
      email,
      password,
      confirmPassword,
    })

    if (!result.success) {
      const fieldErrors: FormErrors = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await signup(tenantName, email, password, fullName)

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(STRINGS.SUCCESS)
        router.push('/verify-email?email=' + encodeURIComponent(email))
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
            <Label htmlFor="tenantName">{STRINGS.TENANT_NAME_LABEL}</Label>
            <Input
              id="tenantName"
              name="tenantName"
              type="text"
              placeholder={STRINGS.TENANT_NAME_PLACEHOLDER}
              autoComplete="organization"
              disabled={isLoading}
              aria-invalid={!!errors.tenantName}
            />
            {errors.tenantName && (
              <p className="text-sm text-destructive">{errors.tenantName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">{STRINGS.FULL_NAME_LABEL}</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder={STRINGS.FULL_NAME_PLACEHOLDER}
              autoComplete="name"
              disabled={isLoading}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>

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
            <Label htmlFor="password">{STRINGS.PASSWORD_LABEL}</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={STRINGS.PASSWORD_PLACEHOLDER}
                autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{STRINGS.CONFIRM_PASSWORD_LABEL}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={STRINGS.CONFIRM_PASSWORD_PLACEHOLDER}
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={!!errors.confirmPassword}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {STRINGS.CREATING_ACCOUNT}
              </>
            ) : (
              STRINGS.CREATE_ACCOUNT
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {STRINGS.HAVE_ACCOUNT}{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              {STRINGS.SIGN_IN}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
