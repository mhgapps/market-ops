"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/loaders";
import api from "@/lib/api-client";
import type { Database, TicketPriority } from "@/types/database";

type TicketCategory = Database["public"]["Tables"]["ticket_categories"]["Row"];

interface CategoryWithDefaults extends TicketCategory {
  default_assignee?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  preferred_vendor?: {
    id: string;
    name: string;
    contact_name: string;
  } | null;
}

interface CreateCategoryData {
  name: string;
  name_es?: string;
  description?: string;
  default_priority: TicketPriority;
  escalation_hours: number;
}

interface UpdateCategoryData {
  name?: string;
  name_es?: string;
  description?: string;
  default_priority?: TicketPriority;
  escalation_hours?: number;
}

export default function CategoriesSettingsPage() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryWithDefaults | null>(null);
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: "",
    name_es: "",
    description: "",
    default_priority: "medium",
    escalation_hours: 4,
  });

  // Fetch categories from API
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ticket-categories"],
    queryFn: async () => {
      const response = await api.get<{ categories: CategoryWithDefaults[] }>(
        "/api/ticket-categories",
      );
      return response.categories;
    },
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      const response = await api.post<{ category: TicketCategory }>(
        "/api/ticket-categories",
        data,
      );
      return response.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-categories"] });
      toast.success("Category created successfully");
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCategoryData;
    }) => {
      const response = await api.patch<{ category: TicketCategory }>(
        `/api/ticket-categories/${id}`,
        data,
      );
      return response.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-categories"] });
      toast.success("Category updated successfully");
      resetForm();
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update category");
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/ticket-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      name_es: "",
      description: "",
      default_priority: "medium",
      escalation_hours: 4,
    });
  };

  const handleAddCategory = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditCategory = (category: CategoryWithDefaults) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_es: category.name_es || "",
      description: category.description || "",
      default_priority: category.default_priority,
      escalation_hours: category.escalation_hours,
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    updateMutation.mutate({ id: editingCategory.id, data: formData });
  };

  const handleDeleteCategory = (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    )
      return;
    deleteMutation.mutate(id);
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const variants: Record<TicketPriority, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return variants[priority] || variants.medium;
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Failed to load categories:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="h-8 w-8" />
            Categories
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage ticket categories for your organization
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category for organizing maintenance tickets
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name *</Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., HVAC, Plumbing, Electrical"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-name-es">
                  Spanish Name (optional)
                </Label>
                <Input
                  id="category-name-es"
                  value={formData.name_es}
                  onChange={(e) =>
                    setFormData({ ...formData, name_es: e.target.value })
                  }
                  placeholder="e.g., Climatización, Plomería"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-description">
                  Description (optional)
                </Label>
                <Input
                  id="category-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this category"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-priority">Default Priority</Label>
                <Select
                  value={formData.default_priority}
                  onValueChange={(value: TicketPriority) =>
                    setFormData({ ...formData, default_priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalation-hours">Escalation Hours</Label>
                <Input
                  id="escalation-hours"
                  type="number"
                  min={1}
                  value={formData.escalation_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      escalation_hours: parseInt(e.target.value) || 4,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Hours before ticket is escalated if not addressed
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Add Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category settings</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name-es">Spanish Name</Label>
              <Input
                id="edit-name-es"
                value={formData.name_es}
                onChange={(e) =>
                  setFormData({ ...formData, name_es: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Default Priority</Label>
              <Select
                value={formData.default_priority}
                onValueChange={(value: TicketPriority) =>
                  setFormData({ ...formData, default_priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-escalation">Escalation Hours</Label>
              <Input
                id="edit-escalation"
                type="number"
                min={1}
                value={formData.escalation_hours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    escalation_hours: parseInt(e.target.value) || 4,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Categories</CardTitle>
          <CardDescription>
            Categories used to organize maintenance tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Default Priority</TableHead>
                  <TableHead>Escalation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                      {category.name_es && (
                        <span className="text-muted-foreground text-sm ml-2">
                          ({category.name_es})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getPriorityBadge(category.default_priority)}
                      >
                        {category.default_priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.escalation_hours}h</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No categories found. Create your first category to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
