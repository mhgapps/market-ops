"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAsset,
  useAssetTransferHistory,
  useDeleteAsset,
  useTransferAsset,
} from "@/hooks/use-assets";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { Database } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransferModal } from "@/components/assets/transfer-modal";
import {
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  Edit,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  Shield,
  AlertTriangle,
  TicketPlus,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageLoader } from "@/components/ui/loaders";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AssetDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: asset, isLoading: assetLoading } = useAsset(id);
  const { data: transferData } = useAssetTransferHistory(id);
  const deleteAsset = useDeleteAsset();
  const transferAsset = useTransferAsset();

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

  // Fetch locations for transfer
  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await api.get<{
        locations: Database["public"]["Tables"]["locations"]["Row"][];
      }>("/api/locations");
      return response.locations;
    },
  });

  const handleTransfer = async (data: {
    to_location_id: string;
    transferred_by: string;
    reason?: string;
    notes?: string;
  }) => {
    await transferAsset.mutateAsync({
      assetId: id,
      ...data,
    });
  };

  const handleDelete = useCallback(async () => {
    await deleteAsset.mutateAsync(id);
    router.push("/assets");
  }, [deleteAsset, id, router]);

  if (assetLoading) {
    return <PageLoader />;
  }

  if (!asset) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-gray-500">Asset not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "under_maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "retired":
        return "bg-gray-100 text-gray-800";
      case "transferred":
        return "bg-blue-100 text-blue-800";
      case "disposed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate warranty expiring status
  const checkWarrantyExpiring = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    return expDate < thirtyDaysFromNow && expDate > today;
  };

  const isWarrantyExpiring = checkWarrantyExpiring(asset.warranty_expiration);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {asset.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className={getStatusColor(asset.status)}>
                {asset.status}
              </Badge>
              {asset.qr_code && (
                <code className="text-sm font-mono text-gray-600">
                  {asset.qr_code}
                </code>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              const params = new URLSearchParams({ asset_id: id });
              if (asset?.location_id)
                params.set("location_id", asset.location_id);
              router.push(`/tickets/new?${params.toString()}`);
            }}
          >
            <TicketPlus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </Button>
          <Button variant="outline" onClick={() => setShowTransferModal(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Transfer</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/assets/${id}/edit`)}
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
      {isWarrantyExpiring && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">
                Warranty expires on{" "}
                {format(new Date(asset.warranty_expiration!), "PPP")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {asset.category && (
                  <div>
                    <div className="text-sm text-gray-600">Category</div>
                    <div className="font-medium">{asset.category.name}</div>
                  </div>
                )}

                {asset.asset_type && (
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-medium">{asset.asset_type.name}</div>
                  </div>
                )}

                {asset.location && (
                  <div>
                    <div className="text-sm text-gray-600">Location</div>
                    <div className="flex items-center gap-1 font-medium">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {asset.location.name}
                    </div>
                  </div>
                )}

                {asset.manufacturer && (
                  <div>
                    <div className="text-sm text-gray-600">Manufacturer</div>
                    <div className="font-medium">{asset.manufacturer}</div>
                  </div>
                )}

                {asset.model && (
                  <div>
                    <div className="text-sm text-gray-600">Model</div>
                    <div className="font-medium">{asset.model}</div>
                  </div>
                )}

                {asset.serial_number && (
                  <div>
                    <div className="text-sm text-gray-600">Serial Number</div>
                    <div className="font-mono text-sm">
                      {asset.serial_number}
                    </div>
                  </div>
                )}

                {asset.vendor && (
                  <div>
                    <div className="text-sm text-gray-600">Vendor/Supplier</div>
                    <div className="font-medium">{asset.vendor.name}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Purchase & Warranty */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase & Warranty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {asset.purchase_date && (
                  <div>
                    <div className="text-sm text-gray-600">Purchase Date</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {format(new Date(asset.purchase_date), "PPP")}
                    </div>
                  </div>
                )}

                {asset.purchase_price && (
                  <div>
                    <div className="text-sm text-gray-600">Purchase Price</div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-500" />$
                      {asset.purchase_price.toLocaleString()}
                    </div>
                  </div>
                )}

                {asset.warranty_expiration && (
                  <div>
                    <div className="text-sm text-gray-600">
                      Warranty Expiration
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-gray-500" />
                      {format(new Date(asset.warranty_expiration), "PPP")}
                    </div>
                  </div>
                )}

                {asset.expected_lifespan_years && (
                  <div>
                    <div className="text-sm text-gray-600">
                      Expected Lifespan
                    </div>
                    <div className="font-medium">
                      {asset.expected_lifespan_years} years
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {asset.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {asset.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Transfer History */}
          {transferData && transferData.transfers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Transfer History ({transferData.transfer_count})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(
                    (transferData.transfers ?? []) as Array<{
                      id: string;
                      transferred_at: string;
                      reason?: string | null;
                      to_location?: { name: string } | null;
                      from_location?: { name: string } | null;
                      transferred_by_user?: { full_name: string } | null;
                    }>
                  ).map((transfer) => (
                    <div
                      key={transfer.id}
                      className="flex items-start gap-3 border-l-2 border-gray-300 pl-4"
                    >
                      <ArrowRightLeft className="h-4 w-4 text-gray-500 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          Transferred to{" "}
                          {transfer.to_location?.name || "Unknown"}
                        </div>
                        {transfer.from_location && (
                          <div className="text-xs text-gray-600">
                            From: {transfer.from_location.name}
                          </div>
                        )}
                        {transfer.reason && (
                          <div className="text-xs text-gray-600">
                            Reason: {transfer.reason}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(transfer.transferred_at), "PPP p")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                  {format(new Date(asset.created_at), "PPP")}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Last Updated</div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  {format(new Date(asset.updated_at), "PPP")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete asset"
        description="Are you sure you want to delete this asset? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteAsset.isPending}
      />

      {/* Transfer Modal */}
      {showTransferModal && locationsData && currentUser && (
        <TransferModal
          assetName={asset.name}
          currentLocationId={asset.location_id}
          open={showTransferModal}
          onOpenChange={setShowTransferModal}
          locations={locationsData}
          userId={currentUser.id}
          onTransfer={handleTransfer}
        />
      )}
    </div>
  );
}
