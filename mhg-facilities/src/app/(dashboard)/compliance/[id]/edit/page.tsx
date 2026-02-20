'use client'

import { useParams, useRouter } from 'next/navigation'
import { ComplianceForm } from '@/components/compliance/compliance-form'
import { useComplianceDocument, useUpdateComplianceDocument } from '@/hooks/use-compliance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditCompliancePage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const { data: document, isLoading } = useComplianceDocument(documentId)
  const updateDocument = useUpdateComplianceDocument()

  const handleSubmit = async (data: {
    name: string
    document_type_id?: string
    location_id?: string
    issue_date?: string
    expiration_date: string
    issuing_authority?: string
    document_number?: string
    renewal_cost?: string
    notes?: string
  }) => {
    try {
      await updateDocument.mutateAsync({
        id: documentId,
        data: {
          name: data.name,
          document_type_id: data.document_type_id || null,
          location_id: data.location_id || null,
          issue_date: data.issue_date || null,
          expiration_date: data.expiration_date,
          issuing_authority: data.issuing_authority || null,
          document_number: data.document_number || null,
          renewal_cost: data.renewal_cost ? parseFloat(data.renewal_cost) : null,
          notes: data.notes || null,
        },
      })
      toast.success('Document updated successfully')
      router.push(`/compliance/${documentId}`)
    } catch (_error) {
      toast.error('Failed to update document')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!document) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/compliance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Document Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The document you are looking for does not exist or has been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/compliance/${documentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Document</h1>
          <p className="text-muted-foreground">{document.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>
            Update the document information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceForm
            initialData={{
              name: document.name,
              document_type_id: document.document_type_id || '',
              location_id: document.location_id || '',
              issue_date: document.issue_date || '',
              expiration_date: document.expiration_date,
              issuing_authority: document.issuing_authority || '',
              document_number: document.document_number || '',
              renewal_cost: document.renewal_cost?.toString() || '',
              notes: document.notes || '',
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateDocument.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
