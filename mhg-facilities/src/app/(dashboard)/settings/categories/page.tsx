'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CategoriesSettingsPage() {
  const [categories, setCategories] = useState([
    { id: '1', name: 'HVAC', color: 'blue', ticketCount: 45 },
    { id: '2', name: 'Plumbing', color: 'green', ticketCount: 32 },
    { id: '3', name: 'Electrical', color: 'yellow', ticketCount: 28 },
    { id: '4', name: 'Security', color: 'red', ticketCount: 15 },
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('blue')

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    // TODO: Call API to create category
    const newCategory = {
      id: String(categories.length + 1),
      name: newCategoryName,
      color: newCategoryColor,
      ticketCount: 0,
    }

    setCategories([...categories, newCategory])
    setNewCategoryName('')
    setNewCategoryColor('blue')
    setIsAddDialogOpen(false)
    toast.success('Category added successfully')
  }

  const handleDeleteCategory = (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    // TODO: Call API to delete category
    setCategories(categories.filter(cat => cat.id !== id))
    toast.success('Category deleted successfully')
  }

  const getColorBadge = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
    }
    return colors[color] || colors.blue
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
            Manage ticket and asset categories
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category for organizing tickets and assets
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., HVAC, Plumbing, Electrical"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <select
                  id="category-color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                  <option value="purple">Purple</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Categories</CardTitle>
          <CardDescription>
            Categories used to organize maintenance tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge className={getColorBadge(category.color)}>
                      {category.color}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.ticketCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
