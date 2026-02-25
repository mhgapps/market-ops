"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";
import { Spinner } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";

const vendorRatingSchema = z.object({
  rating: z.number().int().min(1, "Rating is required").max(5),
  response_time_rating: z
    .number()
    .int()
    .min(1, "Response time rating is required")
    .max(5),
  quality_rating: z.number().int().min(1, "Quality rating is required").max(5),
  cost_rating: z.number().int().min(1, "Cost rating is required").max(5),
  comments: z.string().max(2000).nullable().optional(),
});

type VendorRatingFormValues = z.infer<typeof vendorRatingSchema>;

interface VendorRatingFormProps {
  vendorName: string;
  ticketTitle?: string;
  onSubmit: (data: VendorRatingFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
}

function StarRating({ value, onChange, label, description }: StarRatingProps) {
  return (
    <div className="space-y-2">
      <div>
        <div className="font-medium text-sm">{label}</div>
        {description && <p className="text-xs text-gray-600">{description}</p>}
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={cn(
              "transition-colors rounded p-1",
              "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
            )}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300",
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {value > 0 ? `${value}/5` : "Not rated"}
        </span>
      </div>
    </div>
  );
}

export function VendorRatingForm({
  vendorName,
  ticketTitle,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VendorRatingFormProps) {
  const form = useForm<VendorRatingFormValues>({
    resolver: zodResolver(vendorRatingSchema),
    defaultValues: {
      rating: 0,
      response_time_rating: 0,
      quality_rating: 0,
      cost_rating: 0,
      comments: null,
    },
  });

  const getRatingLabel = (value: number): string => {
    if (value === 0) return "Not rated";
    if (value === 5) return "Excellent";
    if (value === 4) return "Very Good";
    if (value === 3) return "Good";
    if (value === 2) return "Fair";
    return "Poor";
  };

  const overallRating = form.watch("rating");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Vendor Performance</CardTitle>
        <CardDescription>
          Rate <span className="font-medium">{vendorName}</span>
          {ticketTitle && (
            <>
              {" "}
              for ticket <span className="font-medium">{ticketTitle}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Overall Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        label=""
                        description="Overall satisfaction with vendor performance"
                      />
                      {field.value > 0 && (
                        <p className="text-sm font-medium text-gray-700">
                          {getRatingLabel(field.value)}
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Detailed Ratings */}
            <div className="space-y-6 rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium">Detailed Ratings</h3>

              {/* Response Time Rating */}
              <FormField
                control={form.control}
                name="response_time_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        label="Response Time *"
                        description="How quickly did they respond and arrive?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quality Rating */}
              <FormField
                control={form.control}
                name="quality_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        label="Work Quality *"
                        description="How well was the work performed?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost Rating */}
              <FormField
                control={form.control}
                name="cost_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        label="Cost Value *"
                        description="Was the price fair for the work provided?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Comments */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share additional feedback about this vendor's performance, what went well, or areas for improvement..."
                      className="min-h-[120px] resize-y"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide specific feedback to help improve future service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rating Summary */}
            {overallRating > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Note:</span> This rating will be
                  permanently recorded and cannot be edited later. Please ensure
                  your ratings accurately reflect the vendor&apos;s performance.
                </p>
              </div>
            )}

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
                Submit Rating
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
