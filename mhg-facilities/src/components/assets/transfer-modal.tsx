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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

interface Location {
  id: string
  name: string
  address?: string | null
}

interface TransferModalProps {
  assetId: string
  assetName: string
  currentLocationId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  userId: string
  onTransfer: (data: {
    to_location_id: string
    transferred_by: string
    reason?: string
    notes?: string
  }) => void | Promise<void>
}

export function TransferModal({
  assetId,
  assetName,
  currentLocationId,
  open,
  onOpenChange,
  locations,
  userId,
  onTransfer,
}: TransferModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentLocation = locations.find((loc) => loc.id === currentLocationId)
  const availableLocations = locations.filter((loc) => loc.id !== currentLocationId)

  const handleTransfer = async () => {
    if (!selectedLocationId) return

    setIsSubmitting(true)
    try {
      await onTransfer({
        to_location_id: selectedLocationId,
        transferred_by: userId,
        reason: reason || undefined,
        notes: notes || undefined,
      })
      onOpenChange(false)
      // Reset form
      setSelectedLocationId('')
      setReason('')
      setNotes('')
    } catch (error) {
      console.error('Error transferring asset:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transfer Asset</DialogTitle>
          <DialogDescription>
            Transfer <span className="font-medium">{assetName}</span> to a new location.
            This will create an audit trail record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Location */}
          {currentLocation && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <Label className="text-xs text-gray-600">Current Location</Label>
              <div className="mt-1 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{currentLocation.name}</div>
                  {currentLocation.address && (
                    <div className="text-xs text-gray-500">{currentLocation.address}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* New Location */}
          <div className="space-y-2">
            <Label htmlFor="location-select">
              New Location <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger id="location-select">
                <SelectValue placeholder="Select destination location..." />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{location.name}</div>
                        {location.address && (
                          <div className="text-xs text-gray-500">{location.address}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="e.g., Relocation, Replacement, Maintenance"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">Optional - Brief reason for transfer</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details about this transfer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-y"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">Optional - Additional transfer details</p>
          </div>
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
            onClick={handleTransfer}
            disabled={!selectedLocationId || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Transferring...' : 'Transfer Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
