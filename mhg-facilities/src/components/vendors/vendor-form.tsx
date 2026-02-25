"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useImperativeHandle, useCallback, useMemo } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createVendorSchema,
  type CreateVendorInput,
} from "@/lib/validations/assets-vendors";

type VendorFormValues = CreateVendorInput;

export interface VendorFormHandle {
  submit: () => void;
}

interface VendorFormProps {
  defaultValues?: Partial<VendorFormValues>;
  onSubmit: (data: VendorFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
}

const commonServiceCategories = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Landscaping",
  "Cleaning",
  "Security",
  "IT",
  "Construction",
  "Painting",
  "Pest Control",
];

export const VendorForm = forwardRef<VendorFormHandle, VendorFormProps>(
  function VendorForm({ defaultValues, onSubmit }, ref) {
    const form = useForm<VendorFormValues>({
      resolver: zodResolver(createVendorSchema),
      defaultValues: {
        name: "",
        contact_name: null,
        email: null,
        phone: null,
        emergency_phone: null,
        address: null,
        service_categories: [],
        is_preferred: false,
        contract_start_date: null,
        contract_expiration: null,
        insurance_expiration: null,
        insurance_minimum_required: null,
        hourly_rate: null,
        notes: null,
        is_active: true,
        ...defaultValues,
      },
    });

    // Use getValues with a stable callback instead of watch to reduce re-renders
    const serviceCategories = form.watch("service_categories") || [];

    // Memoize the set of selected categories for efficient lookup
    const selectedCategoriesSet = useMemo(
      () => new Set(serviceCategories),
      [serviceCategories],
    );

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
    }));

    // Memoize toggle function to prevent recreation on every render
    const toggleServiceCategory = useCallback(
      (category: string) => {
        const current = form.getValues("service_categories") || [];
        if (current.includes(category)) {
          form.setValue(
            "service_categories",
            current.filter((c) => c !== category),
          );
        } else {
          form.setValue("service_categories", [...current, category]);
        }
      },
      [form],
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Two-column layout on larger screens */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column - Basic & Contact Info */}
            <div className="space-y-6">
              {/* Basic Information Card */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    {/* Vendor Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., ABC HVAC Services"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hourly Rate */}
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hourly Rate ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="75.00"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : null,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Preferred & Active Checkboxes */}
                    <div className="flex flex-wrap gap-6 pt-2">
                      <FormField
                        control={form.control}
                        name="is_preferred"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                id="is_preferred"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor="is_preferred"
                              className="!mt-0 cursor-pointer"
                            >
                              Preferred Vendor
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                id="is_active"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor="is_active"
                              className="!mt-0 cursor-pointer"
                            >
                              Active
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Contact Name */}
                      <FormField
                        control={form.control}
                        name="contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John Doe"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contact@vendor.com"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Phone */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="(555) 123-4567"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Emergency Phone */}
                      <FormField
                        control={form.control}
                        name="emergency_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Phone</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="(555) 987-6543"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="123 Main St, City, State ZIP"
                              className="min-h-[80px] resize-y"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Services & Contract/Insurance */}
            <div className="space-y-6">
              {/* Service Categories Card */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Service Categories
                  </h3>
                  <FormField
                    control={form.control}
                    name="service_categories"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-3">
                          {commonServiceCategories.map((category) => (
                            <div
                              key={category}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`category-${category}`}
                                checked={selectedCategoriesSet.has(category)}
                                onCheckedChange={() =>
                                  toggleServiceCategory(category)
                                }
                              />
                              <label
                                htmlFor={`category-${category}`}
                                className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {category}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormDescription className="mt-3">
                          Select all services this vendor provides
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contract & Insurance Card */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Contract & Insurance
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Contract Start */}
                      <FormField
                        control={form.control}
                        name="contract_start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Start</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Contract Expiration */}
                      <FormField
                        control={form.control}
                        name="contract_expiration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Expiration</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Insurance Expiration */}
                      <FormField
                        control={form.control}
                        name="insurance_expiration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insurance Expiration</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Insurance Minimum */}
                      <FormField
                        control={form.control}
                        name="insurance_minimum_required"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insurance Min. ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                placeholder="1,000,000"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Additional Notes
                  </h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Additional information about the vendor..."
                            className="min-h-[100px] resize-y"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    );
  },
);
