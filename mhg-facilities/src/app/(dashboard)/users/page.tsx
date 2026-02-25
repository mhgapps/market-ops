"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Search, Mail, Phone } from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";
import { InviteUserModal } from "@/components/users/invite-user-modal";
import { EditUserModal } from "@/components/users/edit-user-modal";
import { useAuth } from "@/hooks/use-auth";
import { useUsers, useDeactivateUser, type User } from "@/hooks/use-users";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { TableLoadingOverlay } from "@/components/ui/table-loading-overlay";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Use cached auth hook
  const { user: currentUser, isLoading: authLoading } = useAuth();

  // Debounce search to avoid API calls on every keystroke
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Build filters with memoization
  const filters = useMemo(
    () => ({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(roleFilter !== "all" && { role: roleFilter }),
      ...(statusFilter !== "all" && {
        status: statusFilter as "active" | "inactive" | "all",
      }),
    }),
    [debouncedSearch, roleFilter, statusFilter],
  );

  // Use React Query hook with caching
  const {
    data: users = [],
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useUsers(filters);

  // Deactivate user mutation
  const deactivateUser = useDeactivateUser();

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: "destructive",
      admin: "default",
      manager: "secondary",
      staff: "outline",
      vendor: "outline",
      readonly: "outline",
    } as const;

    const labels = {
      super_admin: "Super Admin",
      admin: "Admin",
      manager: "Manager",
      staff: "Staff",
      vendor: "Vendor",
      readonly: "Read Only",
    } as Record<string, string>;

    return (
      <Badge variant={colors[role as keyof typeof colors] || "outline"}>
        {labels[role] || role}
      </Badge>
    );
  };

  const canManageUsers =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const isLoading = authLoading || usersLoading;

  if (isLoading && users.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Users</h1>
        {canManageUsers && (
          <Button onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="readonly">Read Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Users Found</CardTitle>
            <CardDescription className="text-center mb-4">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "No users match your search criteria"
                : "Get started by inviting your first user"}
            </CardDescription>
            {canManageUsers &&
              !searchQuery &&
              roleFilter === "all" &&
              statusFilter === "all" && (
                <Button onClick={() => setInviteModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              )}
          </CardContent>
        </Card>
      ) : (
        <TableLoadingOverlay isLoading={usersFetching}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Contact
                      </TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Status
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{user.fullName}</div>
                            <div className="text-sm text-muted-foreground md:hidden">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canManageUsers && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingUser(user)}
                                >
                                  Edit
                                </Button>
                                {user.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      deactivateUser.mutate(user.id)
                                    }
                                    disabled={deactivateUser.isPending}
                                  >
                                    {deactivateUser.isPending
                                      ? "Deactivating..."
                                      : "Deactivate"}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TableLoadingOverlay>
      )}

      {/* Summary */}
      {users.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {users.length} user(s)
        </p>
      )}

      {/* Modals */}
      <InviteUserModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      <EditUserModal
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
      />
    </div>
  );
}
