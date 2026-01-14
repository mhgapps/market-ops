'use client'

import { useParams, useRouter } from 'next/navigation'
import { AssetForm } from '@/components/assets/asset-form'
import { useAsset, useUpdateAsset } from '@/hooks/use-assets'
import { useAssetCategories } from '@/hooks/use-asset-categories'
import { useLocations } from '@/hooks/use-locations'
import { useVendors } from '@/hooks/use-vendors'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditAssetPage() {
  const params = useParams()
  const router = useRouter()
  const assetId = params.id as string

  const { data: asset, isLoading: assetLoading } = useAsset(assetId)
  const { data: categoriesData } = useAssetCategories()
  const { data: locationsData } = useLocations()
  const { data: vendorsData } = useVendors()
  const updateAsset = useUpdateAsset()

  const categories = categoriesData?.categories ?? []
  const locations = locationsData ?? []
  const vendors = vendorsData?.data?.map((v: { id: string; name: string; service_categories?: string[] | null }) => ({
    id: v.id,
    name: v.name,
    service_categories: v.service_categories,
  })) ?? []

  const handleSubmit = async (data: Parameters<typeof updateAsset.mutateAsync>[0]['data']) => {
    try {
      await updateAsset.mutateAsync({ id: assetId, data })
      toast.success('Asset updated successfully')
      router.push(`/assets/${assetId}`)
    } catch (error) {
      toast.error('Failed to update asset')
    }
  }

  if (assetLoading) {
    return <PageLoader />
  }

  if (!asset) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/assets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Asset Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The asset you are looking for does not exist or has been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/assets/${assetId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Asset</h1>
          <p className="text-muted-foreground">{asset.name}</p>
        </div>
      </div>

      <AssetForm
        categories={categories}
        locations={locations}
        vendors={vendors}
        defaultValues={{
          name: asset.name,
          category_id: asset.category_id,
          location_id: asset.location_id,
          serial_number: asset.serial_number,
          model: asset.model,
          manufacturer: asset.manufacturer,
          purchase_date: asset.purchase_date,
          purchase_price: asset.purchase_price,
          warranty_expiration: asset.warranty_expiration,
          expected_lifespan_years: asset.expected_lifespan_years,
          notes: asset.notes,
          vendor_id: asset.vendor_id,
          status: asset.status,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/assets/${assetId}`)}
        isSubmitting={updateAsset.isPending}
        mode="edit"
      />
    </div>
  )
}
