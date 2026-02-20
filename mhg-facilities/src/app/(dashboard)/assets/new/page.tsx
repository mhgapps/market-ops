'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useCreateAsset } from '@/hooks/use-assets'
import { AssetForm } from '@/components/assets/asset-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import { toast } from 'sonner'
import api from '@/lib/api-client'

export default function NewAssetPage() {
  const router = useRouter()
  const createAsset = useCreateAsset()

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const response = await api.get<{
        categories: Array<{
          id: string
          name: string
          description: string | null
          default_lifespan_years: number | null
        }>
      }>('/api/asset-categories')
      return response.categories
    },
  })

  // Fetch locations
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get<{
        locations: Array<{
          id: string
          name: string
          address: string | null
        }>
      }>('/api/locations')
      return response.locations
    },
  })

  // Fetch vendors
  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await api.get<{
        data: Array<{
          id: string
          name: string
          service_categories: string[] | null
        }>
      }>('/api/vendors')
      return response.data ?? []
    },
  })

  const isLoading = categoriesLoading || locationsLoading || vendorsLoading

  const handleSubmit = async (formData: {
    name: string
    category_id?: string | null
    location_id?: string | null
    serial_number?: string | null
    model?: string | null
    manufacturer?: string | null
    purchase_date?: string | null
    purchase_price?: number | null
    warranty_expiration?: string | null
    expected_lifespan_years?: number | null
    notes?: string | null
    vendor_id?: string | null
    status: 'active' | 'under_maintenance' | 'retired' | 'transferred' | 'disposed'
  }) => {
    try {
      // Transform null values to undefined for API
      const apiData = {
        name: formData.name,
        status: formData.status,
        ...(formData.category_id && { category_id: formData.category_id }),
        ...(formData.location_id && { location_id: formData.location_id }),
        ...(formData.serial_number && { serial_number: formData.serial_number }),
        ...(formData.model && { model: formData.model }),
        ...(formData.manufacturer && { manufacturer: formData.manufacturer }),
        ...(formData.purchase_date && { purchase_date: formData.purchase_date }),
        ...(formData.purchase_price && { purchase_price: formData.purchase_price }),
        ...(formData.warranty_expiration && { warranty_expiration: formData.warranty_expiration }),
        ...(formData.expected_lifespan_years && { expected_lifespan_years: formData.expected_lifespan_years }),
        ...(formData.notes && { notes: formData.notes }),
        ...(formData.vendor_id && { vendor_id: formData.vendor_id }),
      }

      const asset = await createAsset.mutateAsync(apiData as Parameters<typeof createAsset.mutateAsync>[0])
      toast.success('Asset created successfully')
      router.push(`/assets/${asset.id}`)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to create asset')
      }
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Add New Asset</h1>
      </div>

      {/* Form */}
      <AssetForm
        categories={categoriesData || []}
        locations={locationsData || []}
        vendors={vendorsData || []}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={createAsset.isPending}
        mode="create"
      />
    </div>
  )
}
