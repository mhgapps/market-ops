'use client'

import { useRouter } from 'next/navigation'
import { VendorForm } from '@/components/vendors/vendor-form'
import { useCreateVendor } from '@/hooks/use-vendors'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewVendorPage() {
  const router = useRouter()
  const createVendor = useCreateVendor()

  const handleSubmit = async (data: Parameters<typeof createVendor.mutateAsync>[0]) => {
    try {
      const vendor = await createVendor.mutateAsync(data)
      toast.success('Vendor created successfully')
      router.push(`/vendors/${vendor.id}`)
    } catch (error) {
      toast.error('Failed to create vendor')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Vendor</h1>
          <p className="text-muted-foreground">Register a new vendor in the system</p>
        </div>
      </div>

      <VendorForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/vendors')}
        isSubmitting={createVendor.isPending}
        mode="create"
      />
    </div>
  )
}
