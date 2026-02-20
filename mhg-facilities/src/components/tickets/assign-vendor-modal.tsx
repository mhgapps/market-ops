'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Building2 } from 'lucide-react'

interface Vendor {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string
  service_categories: string[]
}

interface AssignVendorModalProps {
  ticketTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  vendors: Vendor[]
  currentVendorId?: string | null
  onAssign: (vendorId: string) => void | Promise<void>
}

export function AssignVendorModal({
  ticketTitle,
  open,
  onOpenChange,
  vendors,
  currentVendorId,
  onAssign,
}: AssignVendorModalProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    currentVendorId || ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAssign = async () => {
    if (!selectedVendorId) return

    setIsSubmitting(true)
    try {
      await onAssign(selectedVendorId)
      onOpenChange(false)
    } catch (error) {
      console.error('Error assigning vendor:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Assign Ticket to Vendor</DialogTitle>
          <DialogDescription>
            Assign ticket <span className="font-medium">#{ticketTitle}</span> to an external
            vendor for specialized work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-select">Select Vendor</Label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger id="vendor-select">
                <SelectValue placeholder="Choose a vendor..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-xs text-gray-500">
                          {vendor.contact_name} • {vendor.email}
                        </div>
                        {vendor.service_categories && vendor.service_categories.length > 0 && (
                          <div className="mt-1 text-xs text-gray-400">
                            Services: {vendor.service_categories.slice(0, 3).join(', ')}
                            {vendor.service_categories.length > 3 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentVendorId && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Current vendor:</span>{' '}
              {vendors.find((v) => v.id === currentVendorId)?.name || 'Unknown'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={!selectedVendorId || isSubmitting}
          >
            {isSubmitting ? 'Assigning...' : 'Assign to Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
