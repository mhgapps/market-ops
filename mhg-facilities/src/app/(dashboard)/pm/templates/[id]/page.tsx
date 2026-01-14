'use client'

import { useParams, useRouter } from 'next/navigation'
import { usePMTemplate, useUpdatePMTemplate, useDeletePMTemplate } from '@/hooks/use-pm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Trash2, Save } from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export default function PMTemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const { data: template, isLoading } = usePMTemplate(templateId)
  const updateTemplate = useUpdatePMTemplate()
  const deleteTemplate = useDeletePMTemplate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('')

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
      setCategory(template.category || '')
      setEstimatedHours(template.estimated_duration_hours || '')
    }
  }, [template])

  const handleSave = async () => {
    try {
      await updateTemplate.mutateAsync({
        id: templateId,
        data: {
          name,
          description: description || null,
          category: category || null,
          estimated_duration_hours: estimatedHours || null,
        },
      })
      toast.success('Template updated successfully')
    } catch (error) {
      toast.error('Failed to update template')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await deleteTemplate.mutateAsync(templateId)
      toast.success('Template deleted successfully')
      router.push('/pm/templates')
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (!template) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pm/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Template Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pm/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Template</h1>
            <p className="text-muted-foreground">{template.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteTemplate.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateTemplate.isPending || !name}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., HVAC Filter Replacement"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., HVAC, Plumbing, Electrical"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the maintenance task..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Estimated Duration (hours)</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="e.g., 2.5"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
