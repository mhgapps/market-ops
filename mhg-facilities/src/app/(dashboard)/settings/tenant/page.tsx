'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function TenantSettingsPage() {
  const [tenantName, setTenantName] = useState('MHG Facilities')
  const [tenantSlug, setTenantSlug] = useState('mhg-facilities')
  const tenantPlan = 'professional'
  const maxUsers = 50
  const maxLocations = 10

  const handleSave = () => {
    // TODO: Call tenant update API
    toast.success('Tenant settings saved')
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800'
      case 'professional':
        return 'bg-blue-100 text-blue-800'
      case 'basic':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Tenant Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage organization-wide settings (Admin Only)
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900">Admin Access Required</p>
          <p className="text-sm text-amber-700">
            Only administrators can modify tenant settings. Changes affect all users in your organization.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Organization Name</Label>
            <Input
              id="tenant-name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="e.g., Acme Corporation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-slug">Organization Slug</Label>
            <Input
              id="tenant-slug"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="e.g., acme-corp"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Contact support to change your organization slug
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>
            Current plan and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Plan</Label>
            <div>
              <Badge className={getPlanBadgeColor(tenantPlan)}>
                {tenantPlan.charAt(0).toUpperCase() + tenantPlan.slice(1)} Plan
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Max Users</Label>
              <Input
                value={maxUsers}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Locations</Label>
              <Input
                value={maxLocations}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            To upgrade your plan or adjust limits, contact support or visit the billing portal.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
