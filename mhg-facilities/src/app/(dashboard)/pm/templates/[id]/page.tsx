"use client";

import { useParams, useRouter } from "next/navigation";
import {
  usePMTemplate,
  useUpdatePMTemplate,
  useDeletePMTemplate,
} from "@/hooks/use-pm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/loaders";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

// Separate form component that only renders when data is ready
function TemplateForm({
  template,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  template: {
    name: string;
    description: string | null;
    category: string | null;
    estimated_duration_hours: number | null;
  };
  onSave: (data: {
    name: string;
    description: string | null;
    category: string | null;
    estimated_duration_hours: number | null;
  }) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [category, setCategory] = useState(template.category || "");
  const [estimatedHours, setEstimatedHours] = useState<number | "">(
    template.estimated_duration_hours || "",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onSave({
      name,
      description: description || null,
      category: category || null,
      estimated_duration_hours: estimatedHours || null,
    });
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete template"
        description="Are you sure you want to delete this template?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={onDelete}
        loading={isDeleting}
      />

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
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name}>
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
              onChange={(e) =>
                setEstimatedHours(
                  e.target.value ? parseFloat(e.target.value) : "",
                )
              }
              placeholder="e.g., 2.5"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PMTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const { data: template, isLoading } = usePMTemplate(templateId);
  const updateTemplate = useUpdatePMTemplate();
  const deleteTemplate = useDeletePMTemplate();

  const handleSave = async (data: {
    name: string;
    description: string | null;
    category: string | null;
    estimated_duration_hours: number | null;
  }) => {
    try {
      await updateTemplate.mutateAsync({
        id: templateId,
        data,
      });
      toast.success("Template updated successfully");
    } catch (_error) {
      toast.error("Failed to update template");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTemplate.mutateAsync(templateId);
      toast.success("Template deleted successfully");
      router.push("/pm/templates");
    } catch (_error) {
      toast.error("Failed to delete template");
    }
  };

  if (isLoading) {
    return <PageLoader />;
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
    );
  }

  // Use key to reset form when template changes
  return (
    <TemplateForm
      key={template.id}
      template={template}
      onSave={handleSave}
      onDelete={handleDelete}
      isSaving={updateTemplate.isPending}
      isDeleting={deleteTemplate.isPending}
    />
  );
}
