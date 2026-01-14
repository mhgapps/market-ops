'use client'

import { useRouter } from 'next/navigation'
import { useCreatePMTemplate } from '@/hooks/use-pm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState } from 'react'

export default function PMTemplateNewPage() {
  const router = useRouter()
  const createTemplate = useCreatePMTemplate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('')

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }

    try {
      const template = await createTemplate.mutateAsync({
        name,
        description: description || null,
        category: category || null,
        estimated_duration_hours: estimatedHours || null,
      })
      toast.success('Template created successfully')
      router.push(`/pm/templates/${template.id}`)
    } catch (error) {
      toast.error('Failed to create template')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pm/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create PM Template</h1>
            <p className="text-muted-foreground">Create a new preventive maintenance template</p>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={createTemplate.isPending || !name}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
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
