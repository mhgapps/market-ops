import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Clock, Wrench } from 'lucide-react'
import { PMTemplateService } from '@/services/pm-template.service'

async function TemplatesList() {
  const service = new PMTemplateService()
  const templates = await service.getAllTemplates()

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first PM template to standardize maintenance tasks
          </p>
          <Button asChild>
            <Link href="/pm/templates/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Group templates by category
  const byCategory = templates.reduce((acc, template) => {
    const category = template.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, typeof templates>)

  return (
    <div className="space-y-6">
      {Object.entries(byCategory).map(([category, categoryTemplates]) => (
        <div key={category}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {category}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryTemplates.map((template) => (
              <Link key={template.id} href={`/pm/templates/${template.id}`}>
                <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.estimated_duration_hours && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{template.estimated_duration_hours}h</span>
                      </div>
                    )}

                    {template.checklist && typeof template.checklist === 'object' && (
                      <div className="text-sm text-muted-foreground">
                        {Object.keys(template.checklist).length} checklist{' '}
                        {Object.keys(template.checklist).length === 1 ? 'item' : 'items'}
                      </div>
                    )}

                    {template.default_vendor_id && (
                      <Badge variant="secondary">Default Vendor Assigned</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PMTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PM Templates</h1>
          <p className="text-muted-foreground">
            Manage preventive maintenance task templates
          </p>
        </div>
        <Button asChild>
          <Link href="/pm/templates/new">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-[200px] animate-pulse bg-muted" />
            ))}
          </div>
        }
      >
        <TemplatesList />
      </Suspense>
    </div>
  )
}
