"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { uuid, optionalNullableUuid } from "@/lib/validations/shared";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/loaders";
import { AlertTriangle } from "lucide-react";

const ticketFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().max(5000).optional(),
  category_id: optionalNullableUuid("Invalid category"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  location_id: uuid("Please select a location"),
  asset_id: optionalNullableUuid(),
  is_emergency: z.boolean(),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

interface Location {
  id: string;
  name: string;
  address?: string | null;
}

interface Asset {
  id: string;
  name: string;
  serial_number?: string | null;
  location_id: string;
}

interface TicketFormProps {
  categories: Category[];
  locations: Location[];
  assets: Asset[];
  defaultValues?: Partial<TicketFormValues>;
  onSubmit: (data: TicketFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
}

export function TicketForm({
  categories,
  locations,
  assets,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
}: TicketFormProps) {
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: undefined,
      priority: "medium",
      location_id: "",
      asset_id: null,
      is_emergency: false,
      ...defaultValues,
    },
  });

  const [selectedLocationId, isEmergency] = form.watch([
    "location_id",
    "is_emergency",
  ]);

  // Memoize filtered assets to prevent recalculation on every render
  const filteredAssets = useMemo(
    () => assets.filter((asset) => asset.location_id === selectedLocationId),
    [assets, selectedLocationId],
  );

  return (
    <Form {...form}>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle>
              {mode === "create" ? "Create New Ticket" : "Edit Ticket"}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Submit a maintenance or facilities request"
                : "Update ticket information"}
            </CardDescription>
          </div>
          {/* Emergency Toggle - Top Right */}
          <div
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
              isEmergency
                ? "border-red-300 bg-red-100"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-4 w-4 ${isEmergency ? "text-red-600" : "text-red-500"}`}
              />
              <span
                className={`text-sm font-medium ${isEmergency ? "text-red-700" : "text-foreground"}`}
              >
                Emergency
              </span>
            </div>
            <Switch
              checked={isEmergency}
              onCheckedChange={(checked) => {
                form.setValue("is_emergency", checked);
                if (checked) {
                  form.setValue("priority", "critical");
                }
              }}
            />
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title - Full width */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of the issue..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title summarizing the issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Two-column grid for select fields */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              {category.description && (
                                <div className="text-xs text-gray-500">
                                  {category.description}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Low - Can wait
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            Medium - Normal priority
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                            High - Needs attention soon
                          </div>
                        </SelectItem>
                        <SelectItem value="critical">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            Critical - Urgent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear asset when location changes
                        form.setValue("asset_id", null);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div>
                              <div className="font-medium">{location.name}</div>
                              {location.address && (
                                <div className="text-xs text-gray-500">
                                  {location.address}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Asset (Optional) */}
              <FormField
                control={form.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "__none__" ? null : value)
                      }
                      value={field.value || "__none__"}
                      disabled={
                        !selectedLocationId || filteredAssets.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-gray-500">
                            No specific asset
                          </span>
                        </SelectItem>
                        {filteredAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              {asset.serial_number && (
                                <div className="text-xs text-gray-500">
                                  SN: {asset.serial_number}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      {!selectedLocationId
                        ? "Select a location first"
                        : filteredAssets.length === 0
                          ? "No assets at this location"
                          : "Equipment related to this issue"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description - Full width */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed information about the issue, including what happened, when it started, and any other relevant details..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the issue (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner size="sm" className="mr-2" />}
                {mode === "create" ? "Create Ticket" : "Update Ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Form>
  );
}
