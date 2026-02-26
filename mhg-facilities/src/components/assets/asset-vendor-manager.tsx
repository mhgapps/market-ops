"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X, Star, Plus } from "lucide-react";

interface VendorEntry {
  vendor_id: string;
  is_primary: boolean;
  notes?: string | null;
}

interface AssetVendorManagerProps {
  vendors: Array<{ id: string; name: string }>;
  selectedVendors: VendorEntry[];
  onChange: (vendors: VendorEntry[]) => void;
}

export function AssetVendorManager({
  vendors,
  selectedVendors,
  onChange,
}: AssetVendorManagerProps) {
  const [open, setOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const selectedIds = new Set(selectedVendors.map((v) => v.vendor_id));
  const availableVendors = vendors.filter((v) => !selectedIds.has(v.id));

  const getVendorName = (vendorId: string) =>
    vendors.find((v) => v.id === vendorId)?.name ?? "Unknown Vendor";

  const handleAdd = (vendorId: string) => {
    const isPrimary = selectedVendors.length === 0;
    onChange([...selectedVendors, { vendor_id: vendorId, is_primary: isPrimary }]);
    setOpen(false);
  };

  const handleRemove = (vendorId: string) => {
    const updated = selectedVendors.filter((v) => v.vendor_id !== vendorId);
    if (updated.length > 0 && !updated.some((v) => v.is_primary)) {
      updated[0].is_primary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = (vendorId: string) => {
    onChange(
      selectedVendors.map((v) => ({
        ...v,
        is_primary: v.vendor_id === vendorId,
      })),
    );
  };

  const handleNotesChange = (vendorId: string, notes: string) => {
    onChange(
      selectedVendors.map((v) =>
        v.vendor_id === vendorId ? { ...v, notes: notes || null } : v,
      ),
    );
  };

  const toggleNotes = (vendorId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) next.delete(vendorId);
      else next.add(vendorId);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {selectedVendors.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No vendors assigned. Add a vendor below.
        </p>
      )}

      {selectedVendors.map((entry) => (
        <div
          key={entry.vendor_id}
          className="rounded-md border p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium truncate">
                {getVendorName(entry.vendor_id)}
              </span>
              {entry.is_primary ? (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  Primary
                </Badge>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(entry.vendor_id)}
                  className="text-xs text-muted-foreground hover:text-foreground underline shrink-0 min-h-[44px] flex items-center"
                >
                  Set primary
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleNotes(entry.vendor_id)}
                title="Add notes"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    entry.notes
                      ? "fill-current text-amber-500"
                      : "text-muted-foreground",
                  )}
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(entry.vendor_id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {(expandedNotes.has(entry.vendor_id) || entry.notes) && (
            <Input
              placeholder="Notes (e.g., backup supplier, specialty services...)"
              value={entry.notes || ""}
              onChange={(e) =>
                handleNotesChange(entry.vendor_id, e.target.value)
              }
              className="text-sm"
            />
          )}
        </div>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            disabled={availableVendors.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search vendors..." />
            <CommandList>
              <CommandEmpty>No vendors found.</CommandEmpty>
              <CommandGroup>
                {availableVendors.map((vendor) => (
                  <CommandItem
                    key={vendor.id}
                    value={vendor.name}
                    onSelect={() => handleAdd(vendor.id)}
                    className="min-h-[44px]"
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    {vendor.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
