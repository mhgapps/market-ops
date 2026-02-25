"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useVendor,
  useVendorRatings,
  useDeleteVendor,
  useCreateVendorRating,
} from "@/hooks/use-vendors";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { Database } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VendorRatingForm } from "@/components/vendors/vendor-rating-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  Edit,
  Trash2,
  Star,
  DollarSign,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/loaders";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VendorDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: vendor, isLoading: vendorLoading } = useVendor(id);
  const { data: ratingsData } = useVendorRatings(id);
  const deleteVendor = useDeleteVendor();
  const createRating = useCreateVendorRating();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const response = await api.get<{
        user: Database["public"]["Tables"]["users"]["Row"];
      }>("/api/auth/me");
      return response.user;
    },
  });

  const handleDelete = useCallback(async () => {
    await deleteVendor.mutateAsync(id);
    router.push("/vendors");
  }, [deleteVendor, id, router]);

  const handleSubmitRating = async (data: {
    rating: number;
    response_time_rating: number;
    quality_rating: number;
    cost_rating: number;
    comments?: string | null;
  }) => {
    if (!currentUser) return;

    await createRating.mutateAsync({
      vendorId: id,
      rating: data.rating,
      response_time_rating: data.response_time_rating,
      quality_rating: data.quality_rating,
      cost_rating: data.cost_rating,
      comments: data.comments || undefined,
    });
    setShowRatingForm(false);
  };

  if (vendorLoading) {
    return <PageLoader />;
  }

  if (!vendor) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-gray-500">Vendor not found</p>
      </div>
    );
  }

  // Calculate expiring status
  const checkExpiring = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    return expDate < thirtyDaysFromNow && expDate > today;
  };

  const isInsuranceExpiring = checkExpiring(vendor.insurance_expiration);
  const isContractExpiring = checkExpiring(vendor.contract_expiration);

  const ratings = ratingsData?.ratings || [];
  const stats = ratingsData?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {vendor.name}
              </h1>
              {vendor.is_preferred && (
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                className={
                  vendor.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {vendor.is_active ? "Active" : "Inactive"}
              </Badge>
              {vendor.is_preferred && (
                <Badge className="bg-blue-100 text-blue-800">
                  Preferred Vendor
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRatingForm(true)}>
            <Star className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Rate</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/vendors/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {(isInsuranceExpiring || isContractExpiring) && (
        <div className="space-y-2">
          {isInsuranceExpiring && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium">
                    Insurance expires on{" "}
                    {format(new Date(vendor.insurance_expiration!), "PPP")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {isContractExpiring && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium">
                    Contract expires on{" "}
                    {format(new Date(vendor.contract_expiration!), "PPP")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {vendor.contact_name && (
                  <div>
                    <div className="text-sm text-gray-600">Contact Person</div>
                    <div className="font-medium">{vendor.contact_name}</div>
                  </div>
                )}

                {vendor.email && (
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {vendor.email}
                      </a>
                    </div>
                  </div>
                )}

                {vendor.phone && (
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a
                        href={`tel:${vendor.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {vendor.phone}
                      </a>
                    </div>
                  </div>
                )}

                {vendor.emergency_phone && (
                  <div>
                    <div className="text-sm text-gray-600">Emergency Phone</div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-red-500" />
                      <a
                        href={`tel:${vendor.emergency_phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {vendor.emergency_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {vendor.address && (
                <div>
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="flex items-start gap-1">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <p className="whitespace-pre-wrap">{vendor.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Categories */}
          {vendor.service_categories &&
            vendor.service_categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services Provided</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.service_categories.map((category: string) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Contract & Insurance */}
          <Card>
            <CardHeader>
              <CardTitle>Contract & Insurance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {vendor.contract_start_date && (
                  <div>
                    <div className="text-sm text-gray-600">Contract Start</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {format(new Date(vendor.contract_start_date), "PPP")}
                    </div>
                  </div>
                )}

                {vendor.contract_expiration && (
                  <div>
                    <div className="text-sm text-gray-600">
                      Contract Expiration
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {format(new Date(vendor.contract_expiration), "PPP")}
                    </div>
                  </div>
                )}

                {vendor.insurance_expiration && (
                  <div>
                    <div className="text-sm text-gray-600">
                      Insurance Expiration
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-gray-500" />
                      {format(new Date(vendor.insurance_expiration), "PPP")}
                    </div>
                  </div>
                )}

                {vendor.insurance_minimum_required && (
                  <div>
                    <div className="text-sm text-gray-600">
                      Insurance Minimum
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-gray-500" />$
                      {vendor.insurance_minimum_required.toLocaleString()}
                    </div>
                  </div>
                )}

                {vendor.hourly_rate && (
                  <div>
                    <div className="text-sm text-gray-600">Hourly Rate</div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-500" />$
                      {vendor.hourly_rate.toFixed(2)}/hour
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {vendor.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {vendor.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ratings History */}
          {ratings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rating History ({ratings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(
                    ratings as unknown as Array<{
                      id: string;
                      rating: number;
                      comment: string | null;
                      created_at: string;
                      response_time_rating: number;
                      quality_rating: number;
                      cost_rating: number;
                      rated_by_user?: { full_name: string } | null;
                    }>
                  ).map((rating) => (
                    <div
                      key={rating.id}
                      className="border-l-2 border-gray-300 pl-4"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          {rating.rating}/5
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <div>Response: {rating.response_time_rating}/5</div>
                        <div>Quality: {rating.quality_rating}/5</div>
                        <div>Cost: {rating.cost_rating}/5</div>
                      </div>
                      {rating.comment && (
                        <p className="mt-2 text-sm text-gray-700">
                          {rating.comment}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {format(new Date(rating.created_at), "PPP")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rating Summary */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Rating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {stats.average_rating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(stats.average_rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats.total_ratings} rating
                    {stats.total_ratings !== 1 ? "s" : ""}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-medium">
                      {stats.average_response_time.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Work Quality</span>
                    <span className="font-medium">
                      {stats.average_quality.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost Value</span>
                    <span className="font-medium">
                      {stats.average_cost.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-gray-600">Created</div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  {format(new Date(vendor.created_at), "PPP")}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Last Updated</div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  {format(new Date(vendor.updated_at), "PPP")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete vendor"
        description="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteVendor.isPending}
      />

      {/* Rating Form Dialog */}
      <Dialog open={showRatingForm} onOpenChange={setShowRatingForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <VendorRatingForm
            vendorName={vendor.name}
            onSubmit={handleSubmitRating}
            onCancel={() => setShowRatingForm(false)}
            isSubmitting={createRating.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
