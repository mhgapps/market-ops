'use client'

import { useRouter } from 'next/navigation'
import { ComplianceForm } from '@/components/compliance/compliance-form'
import { useCreateComplianceDocument } from '@/hooks/use-compliance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewCompliancePage() {
  const router = useRouter()
  const createDocument = useCreateComplianceDocument()

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
      const document = await createDocument.mutateAsync({
        name: data.name,
        document_type_id: data.document_type_id || null,
        location_id: data.location_id || null,
        issue_date: data.issue_date || null,
        expiration_date: data.expiration_date,
        issuing_authority: data.issuing_authority || null,
        document_number: data.document_number || null,
        renewal_cost: data.renewal_cost ? parseFloat(data.renewal_cost) : null,
        notes: data.notes || null,
      })
      toast.success('Document created successfully')
      router.push(`/compliance/${document.id}`)
    } catch (_error) {
      toast.error('Failed to create document')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/compliance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add Document</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>
            Enter the details of the document you want to track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceForm
            onSubmit={handleSubmit}
            isSubmitting={createDocument.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
