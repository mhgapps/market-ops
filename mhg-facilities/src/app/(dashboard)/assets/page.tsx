"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAssets } from "@/hooks/use-assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, QrCode, MapPin, Download } from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";
import api from "@/lib/api-client";
import type { Database } from "@/types/database";
import { TableLoadingOverlay } from "@/components/ui/table-loading-overlay";

export default function AssetsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Debounce search to avoid API calls on every keystroke
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const filters = useMemo(
    () => ({
      ...(statusFilter !== "all" && {
        status: statusFilter as
          | "active"
          | "under_maintenance"
          | "retired"
          | "transferred"
          | "disposed",
      }),
      ...(debouncedSearch && { search: debouncedSearch }),
      page,
      pageSize,
    }),
    [statusFilter, debouncedSearch, page, pageSize],
  );

  const { data, isLoading, isFetching } = useAssets(filters);
  const assets = data?.data || [];
  const totalCount = data?.total ?? 0;

  // Pre-compute stats counts in a single pass to avoid multiple filter calls during render
  const stats = useMemo(() => {
    let active = 0;
    let underMaintenance = 0;
    let retired = 0;

    for (const asset of assets) {
      if (asset.status === "active") active++;
      else if (asset.status === "under_maintenance") underMaintenance++;
      else if (asset.status === "retired") retired++;
    }

    return { active, underMaintenance, retired };
  }, [assets]);

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

  const handleExportCSV = async () => {
    try {
      type ExportAsset = {
        id: string;
        name: string;
        qr_code: string | null;
        status: string;
        serial_number: string | null;
        model: string | null;
        manufacturer: string | null;
        category?: { name: string } | null;
        location?: { name: string } | null;
        vendors?: Array<{
          name: string;
          is_primary: boolean;
        }>;
      };

      // Fetch all pages (API max is 100 per page)
      const allAssets: ExportAsset[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await api.get<{ data: ExportAsset[]; total: number }>(
          `/api/assets?pageSize=100&page=${currentPage}`
        );
        allAssets.push(...(response.data || []));
        hasMore = allAssets.length < response.total;
        currentPage++;
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      const csvRows = [
        [
          "Asset Name",
          "QR Code",
          "URL",
          "Location",
          "Category",
          "Primary Vendor",
          "Status",
          "Serial Number",
          "Model",
          "Manufacturer",
        ].join(","),
        ...allAssets.map((a) => {
          const primaryVendor =
            a.vendors?.find((v) => v.is_primary)?.name || "";
          return [
            `"${(a.name || "").replace(/"/g, '""')}"`,
            a.qr_code || "",
            a.qr_code ? `${appUrl}/qr/${encodeURIComponent(a.qr_code)}` : "",
            `"${(a.location?.name || "").replace(/"/g, '""')}"`,
            `"${(a.category?.name || "").replace(/"/g, '""')}"`,
            `"${primaryVendor.replace(/"/g, '""')}"`,
            a.status || "",
            a.serial_number || "",
            `"${(a.model || "").replace(/"/g, '""')}"`,
            `"${(a.manufacturer || "").replace(/"/g, '""')}"`,
          ].join(",");
        },
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `assets-labels-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
    }
  };

  if (isLoading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Assets</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export for Labels</span>
          </Button>
          <Button onClick={() => router.push("/assets/new")}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Asset</span>
          </Button>
        </div>
      </div>

      {/* Stats Strip */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-border">
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => setStatusFilter("all")}
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{totalCount}</span>
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => setStatusFilter("active")}
          >
            <Plus className="h-4 w-4 text-green-600" />
            <span className="font-semibold">{stats.active}</span>
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => setStatusFilter("under_maintenance")}
          >
            <QrCode className="h-4 w-4 text-amber-600" />
            <span className="font-semibold">{stats.underMaintenance}</span>
            <span className="text-sm text-muted-foreground">
              Under Maintenance
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => setStatusFilter("retired")}
          >
            <Search className="h-4 w-4 text-gray-500" />
            <span className="font-semibold">{stats.retired}</span>
            <span className="text-sm text-muted-foreground">Retired</span>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search by name, model, serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="under_maintenance">
                  Under Maintenance
                </SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets List */}
      <TableLoadingOverlay isLoading={isFetching}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assets ({totalCount})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No assets found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/assets/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Asset
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Category
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Type
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Location
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Primary Vendor
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        QR Code
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      assets as unknown as Array<
                        Database["public"]["Tables"]["assets"]["Row"] & {
                          location?: { name: string } | null;
                          category?: { name: string } | null;
                          asset_type?: { name: string } | null;
                          vendors?: Array<{
                            id: string;
                            vendor_id: string;
                            name: string;
                            is_primary: boolean;
                            notes: string | null;
                          }>;
                        }
                      >
                    ).map((asset) => (
                      <TableRow
                        key={asset.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/assets/${asset.id}`)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            {asset.model && (
                              <div className="text-sm text-gray-500">
                                {asset.manufacturer && `${asset.manufacturer} `}
                                {asset.model}
                              </div>
                            )}
                            {asset.serial_number && (
                              <div className="text-xs text-gray-500 md:hidden">
                                SN: {asset.serial_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {asset.category?.name || "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {asset.asset_type?.name || "-"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            {asset.location?.name || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {asset.vendors?.find((v) => v.is_primary)?.name ||
                            "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {asset.qr_code && (
                            <code className="text-xs font-mono">
                              {asset.qr_code}
                            </code>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/assets/${asset.id}`);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalCount > 0 && (
                  <div className="flex items-center justify-between border-t px-4 py-4">
                    <span className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to{" "}
                      {Math.min(page * pageSize, totalCount)} of {totalCount}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page * pageSize >= totalCount}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TableLoadingOverlay>
    </div>
  );
}
