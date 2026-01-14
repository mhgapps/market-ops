'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useCreateAsset } from '@/hooks/use-assets'
import { AssetForm } from '@/components/assets/asset-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Loader2 } from 'lucide-react'
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
        vendors: Array<{
          id: string
          name: string
          service_categories: string[] | null
        }>
      }>('/api/vendors')
      return response.vendors
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
    condition_notes?: string | null
    vendor_id?: string | null
    status: 'active' | 'maintenance' | 'retired' | 'disposed'
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
        ...(formData.condition_notes && { condition_notes: formData.condition_notes }),
        ...(formData.vendor_id && { vendor_id: formData.vendor_id }),
      }

      const asset = await createAsset.mutateAsync(apiData)
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
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Add New Asset</h1>
          <p className="mt-1 text-sm text-gray-600">
            Register a new equipment or facility asset
          </p>
        </div>
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
