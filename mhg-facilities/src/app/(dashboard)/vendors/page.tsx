"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useVendors } from "@/hooks/use-vendors";
import type { Database } from "@/types/database";
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
import { Plus, Search, Star, Phone, Mail } from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";
import { TableLoadingOverlay } from "@/components/ui/table-loading-overlay";

export default function VendorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [preferredFilter, setPreferredFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const filters = {
    ...(searchQuery && { search: searchQuery }),
    ...(activeFilter === "active" && { is_active: true }),
    ...(activeFilter === "inactive" && { is_active: false }),
    ...(preferredFilter === "preferred" && { is_preferred: true }),
    page,
    pageSize,
  };

  const { data, isLoading, isFetching } = useVendors(filters);
  const vendors = data?.data || [];
  const totalCount = data?.total ?? 0;

  // Helper function to check if insurance is expiring within 30 days
  const isInsuranceExpiring = (expiration: string | null) => {
    if (!expiration) return false;
    const expiryDate = new Date(expiration);
    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    return expiryDate < thirtyDaysFromNow && expiryDate > today;
  };

  // Pre-compute stats counts in a single pass to avoid multiple filter calls during render
  const stats = useMemo(() => {
    let active = 0;
    let preferred = 0;
    let insuranceExpiring = 0;

    for (const vendor of vendors) {
      if (vendor.is_active) active++;
      if (vendor.is_preferred) preferred++;
      if (isInsuranceExpiring(vendor.insurance_expiration)) insuranceExpiring++;
    }

    return { active, preferred, insuranceExpiring };
  }, [vendors]);

  if (isLoading && !data) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Vendors
        </h1>
        <Button onClick={() => router.push("/vendors/new")}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Vendor</span>
        </Button>
      </div>

      {/* Stats Strip */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-border">
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => {
              setActiveFilter("all");
              setPreferredFilter("all");
            }}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{totalCount}</span>
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => {
              setActiveFilter("active");
              setPreferredFilter("all");
            }}
          >
            <Phone className="h-4 w-4 text-green-600" />
            <span className="font-semibold">{stats.active}</span>
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => {
              setActiveFilter("all");
              setPreferredFilter("preferred");
            }}
          >
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold">{stats.preferred}</span>
            <span className="text-sm text-muted-foreground">Preferred</span>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer ${
              stats.insuranceExpiring > 0 ? "bg-amber-50" : ""
            }`}
            onClick={() => {
              setActiveFilter("all");
              setPreferredFilter("all");
            }}
          >
            <Mail
              className={`h-4 w-4 ${
                stats.insuranceExpiring > 0
                  ? "text-amber-600"
                  : "text-muted-foreground"
              }`}
            />
            <span
              className={`font-semibold ${
                stats.insuranceExpiring > 0 ? "text-amber-700" : ""
              }`}
            >
              {stats.insuranceExpiring}
            </span>
            <span className="text-sm text-muted-foreground">
              Expiring Insurance
            </span>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search by name, service, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Active Filter */}
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Preferred Filter */}
            <Select value={preferredFilter} onValueChange={setPreferredFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                <SelectItem value="preferred">Preferred Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <TableLoadingOverlay isLoading={isFetching}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendors ({totalCount})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No vendors found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/vendors/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Vendor
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Services
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Contact
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Status
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      vendors as unknown as Array<
                        Database["public"]["Tables"]["vendors"]["Row"]
                      >
                    ).map((vendor) => (
                      <TableRow
                        key={vendor.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/vendors/${vendor.id}`)}
                      >
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{vendor.name}</div>
                              {vendor.is_preferred && (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            {vendor.contact_name && (
                              <div className="text-sm text-gray-500">
                                {vendor.contact_name}
                              </div>
                            )}
                            {/* Mobile: Show insurance warning */}
                            {isInsuranceExpiring(
                              vendor.insurance_expiration,
                            ) && (
                              <Badge className="mt-1 bg-yellow-100 text-yellow-800 text-xs md:hidden">
                                Insurance Expiring
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {vendor.service_categories &&
                            vendor.service_categories.length > 0 ? (
                              vendor.service_categories
                                .slice(0, 2)
                                .map((cat: string) => (
                                  <Badge
                                    key={cat}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {cat}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                            {vendor.service_categories &&
                              vendor.service_categories.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{vendor.service_categories.length - 2}
                                </Badge>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-1 text-sm">
                            {vendor.phone && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Phone className="h-3 w-3" />
                                {vendor.phone}
                              </div>
                            )}
                            {vendor.email && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Mail className="h-3 w-3" />
                                {vendor.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            <Badge
                              className={
                                vendor.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {vendor.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {isInsuranceExpiring(
                              vendor.insurance_expiration,
                            ) && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Insurance Expiring
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-[40px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/vendors/${vendor.id}`);
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t px-4 py-4">
                    <span className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to{" "}
                      {Math.min(page * pageSize, totalCount)} of {totalCount}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
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
