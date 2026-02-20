'use client'

import { useParams, useRouter } from 'next/navigation'
import { VendorForm } from '@/components/vendors/vendor-form'
import { useVendor, useUpdateVendor } from '@/hooks/use-vendors'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditVendorPage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.id as string

  const { data: vendor, isLoading } = useVendor(vendorId)
  const updateVendor = useUpdateVendor()

  const handleSubmit = async (data: Parameters<typeof updateVendor.mutateAsync>[0]['data']) => {
    try {
      await updateVendor.mutateAsync({ id: vendorId, data })
      toast.success('Vendor updated successfully')
      router.push(`/vendors/${vendorId}`)
    } catch (_error) {
      toast.error('Failed to update vendor')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!vendor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Vendor Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The vendor you are looking for does not exist or has been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/vendors/${vendorId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Vendor</h1>
          <p className="text-muted-foreground">{vendor.name}</p>
        </div>
      </div>

      <VendorForm
        defaultValues={{
          name: vendor.name,
          contact_name: vendor.contact_name,
          email: vendor.email,
          phone: vendor.phone,
          emergency_phone: vendor.emergency_phone,
          address: vendor.address,
          service_categories: vendor.service_categories,
          is_preferred: vendor.is_preferred ?? false,
          contract_start_date: vendor.contract_start_date,
          contract_expiration: vendor.contract_expiration,
          insurance_expiration: vendor.insurance_expiration,
          insurance_minimum_required: vendor.insurance_minimum_required,
          hourly_rate: vendor.hourly_rate,
          notes: vendor.notes,
          is_active: vendor.is_active,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/vendors/${vendorId}`)}
        isSubmitting={updateVendor.isPending}
        mode="edit"
      />
    </div>
  )
}
