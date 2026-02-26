"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TicketStatus } from "./status-badge";

interface StatusActionsProps {
  currentStatus: TicketStatus;
  userRole: "admin" | "manager" | "staff" | "user";
  isAssigned: boolean;
  onAction: (
    action: string,
    data?: { cost?: number; notes?: string; new_status?: string },
  ) => void | Promise<void>;
  loading?: boolean;
}

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
];

export function StatusActions({
  currentStatus,
  userRole,
  onAction,
  loading = false,
}: StatusActionsProps) {
  // Consolidate related state into a single object to reduce useState calls
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    cost: "",
    notes: "",
    isSubmitting: false,
  });
  const [selectedStatus, setSelectedStatus] =
    useState<TicketStatus>(currentStatus);

  // All hooks must be called before any early returns
  const handleStatusChange = useCallback(
    async (newStatus: TicketStatus) => {
      if (newStatus === currentStatus) return;

      setSelectedStatus(newStatus);

      if (newStatus === "closed") {
        // Show dialog to capture cost/notes when closing
        setDialogState((prev) => ({ ...prev, isOpen: true }));
      } else {
        // Direct status change via set_status action
        await onAction("set_status", { new_status: newStatus });
      }
    },
    [currentStatus, onAction],
  );

  const handleCloseSubmit = useCallback(async () => {
    setDialogState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await onAction("close", {
        cost: dialogState.cost ? parseFloat(dialogState.cost) : undefined,
        notes: dialogState.notes || undefined,
      });
      setDialogState({
        isOpen: false,
        cost: "",
        notes: "",
        isSubmitting: false,
      });
    } finally {
      setDialogState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [onAction, dialogState.cost, dialogState.notes]);

  const handleCloseCancel = useCallback(() => {
    setDialogState({ isOpen: false, cost: "", notes: "", isSubmitting: false });
    setSelectedStatus(currentStatus); // Reset to current status
  }, [currentStatus]);

  // Only managers and admins can change status - early return after hooks
  if (userRole === "user") {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Label htmlFor="status-select" className="text-sm font-medium">
          Status:
        </Label>
        <Select
          value={selectedStatus}
          onValueChange={(value) => handleStatusChange(value as TicketStatus)}
          disabled={loading || dialogState.isSubmitting}
        >
          <SelectTrigger id="status-select" className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Close Ticket Dialog */}
      <Dialog
        open={dialogState.isOpen}
        onOpenChange={(open) => !open && handleCloseCancel()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Close Ticket</DialogTitle>
            <DialogDescription>
              Enter the final cost and any notes before closing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Final Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={dialogState.cost}
                onChange={(e) =>
                  setDialogState((prev) => ({ ...prev, cost: e.target.value }))
                }
              />
              <p className="text-xs text-gray-500">
                Enter the total cost from the vendor invoice
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Resolution Notes</Label>
              <Textarea
                id="notes"
                placeholder="What was done to resolve this issue..."
                value={dialogState.notes}
                onChange={(e) =>
                  setDialogState((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseCancel}
              disabled={dialogState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCloseSubmit}
              disabled={dialogState.isSubmitting}
            >
              {dialogState.isSubmitting ? "Closing..." : "Close Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
