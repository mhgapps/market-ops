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
import { UserCircle } from 'lucide-react'

interface StaffMember {
  id: string
  full_name: string
  role: string
  email: string
}

interface AssignModalProps {
  ticketId: string
  ticketTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  staffMembers: StaffMember[]
  currentAssigneeId?: string | null
  onAssign: (staffId: string) => void | Promise<void>
}

export function AssignModal({
  ticketId,
  ticketTitle,
  open,
  onOpenChange,
  staffMembers,
  currentAssigneeId,
  onAssign,
}: AssignModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    currentAssigneeId || ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAssign = async () => {
    if (!selectedStaffId) return

    setIsSubmitting(true)
    try {
      await onAssign(selectedStaffId)
      onOpenChange(false)
    } catch (error) {
      console.error('Error assigning ticket:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Ticket to Staff</DialogTitle>
          <DialogDescription>
            Assign ticket <span className="font-medium">#{ticketTitle}</span> to a staff
            member who will handle the work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staff-select">Select Staff Member</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger id="staff-select">
                <SelectValue placeholder="Choose a staff member..." />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{staff.full_name}</div>
                        <div className="text-xs text-gray-500">
                          {staff.role} • {staff.email}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentAssigneeId && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Current assignee:</span>{' '}
              {staffMembers.find((s) => s.id === currentAssigneeId)?.full_name ||
                'Unknown'}
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
            disabled={!selectedStaffId || isSubmitting}
          >
            {isSubmitting ? 'Assigning...' : 'Assign Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
