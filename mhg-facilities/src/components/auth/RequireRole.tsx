'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/database'

interface RequireRoleProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * RequireRole Component
 *
 * Wrapper component that checks if the current user has one of the allowed roles.
 * If not, either shows a fallback or redirects to a different page.
 *
 * Usage:
 * ```tsx
 * <RequireRole allowedRoles={['admin', 'manager']}>
 *   <AdminDashboard />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  children,
  allowedRoles,
  fallback,
  redirectTo,
}: RequireRoleProps) {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  useEffect(() => {
    async function checkRole() {
      try {
        const response = await fetch('/api/auth/me')

        if (!response.ok) {
          setHasAccess(false)
          if (redirectTo) {
            router.push(redirectTo)
          }
          return
        }

        const data = await response.json()
        const role = data.user?.role

        setUserRole(role)

        if (allowedRoles.includes(role)) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
          if (redirectTo) {
            router.push(redirectTo)
          }
        }
      } catch (error) {
        console.error('Error checking role:', error)
        setHasAccess(false)
        if (redirectTo) {
          router.push(redirectTo)
        }
      }
    }

    checkRole()
  }, [allowedRoles, redirectTo, router])

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Access denied state
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to view this page.
          </p>
          {userRole && (
            <p className="text-sm text-gray-500 mb-6">
              Your role: <span className="font-medium">{userRole}</span>
            </p>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Access granted
  return <>{children}</>
}
