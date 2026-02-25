"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  useTicket,
  useTicketComments,
  useTicketAttachments,
  useTicketStatusAction,
  useAssignTicket,
  useAddComment,
  useUploadAttachment,
  useDeleteAttachment,
  useUpdateTicket,
} from "@/hooks/use-tickets";
import { useTicketRealtime } from "@/hooks/use-realtime";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { Database } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/tickets/status-badge";
import { StatusTimeline } from "@/components/tickets/status-timeline";
import { StatusActions } from "@/components/tickets/status-actions";
import { AssignModal } from "@/components/tickets/assign-modal";
import { AssignVendorModal } from "@/components/tickets/assign-vendor-modal";
import { CommentList } from "@/components/tickets/comment-list";
import { CommentForm } from "@/components/tickets/comment-form";
import { AttachmentGallery } from "@/components/tickets/attachment-gallery";
import { AttachmentUpload } from "@/components/tickets/attachment-upload";
import {
  MapPin,
  Package,
  User,
  Calendar,
  Clock,
  ChevronLeft,
  Users,
  Building2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";
import { format } from "date-fns";
import { useState } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Subscribe to realtime updates for this specific ticket
  useTicketRealtime(id);

  // Fetch ticket data
  const { data: ticket, isLoading: ticketLoading } = useTicket(id);
  const { data: comments = [] } = useTicketComments(id, true);
  const { data: attachments = [] } = useTicketAttachments(id);

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

  // Fetch assignable users (staff, managers, admins)
  // API requires manager+ role, will return 403 for non-managers
  interface AssignableUser {
    id: string;
    fullName: string;
    role: string;
    email: string;
  }
  const { data: staffData } = useQuery({
    queryKey: ["assignable-users"],
    queryFn: async () => {
      // Fetch all users then filter to assignable roles
      const response = await api.get<{ users: AssignableUser[] }>("/api/users");
      return response.users.filter(
        (u) => u.role === "staff" || u.role === "manager" || u.role === "admin",
      );
    },
  });

  // Fetch vendors (API returns paginated result)
  const { data: vendorsData } = useQuery({
    queryKey: ["vendors-for-assignment"],
    queryFn: async () => {
      const response = await api.get<{
        data: Database["public"]["Tables"]["vendors"]["Row"][];
        total: number;
      }>("/api/vendors?is_active=true");
      return response.data;
    },
  });

  // Mutations
  const statusAction = useTicketStatusAction(id);
  const assignTicket = useAssignTicket(id);
  const addComment = useAddComment(id);
  const uploadAttachment = useUploadAttachment(id);
  const deleteAttachment = useDeleteAttachment(id);
  const updateTicket = useUpdateTicket(id);

  const handleStatusAction = async (
    action: string,
    data?: { cost?: number; notes?: string; new_status?: string },
  ) => {
    try {
      await statusAction.mutateAsync({ action, ...data });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    try {
      await assignTicket.mutateAsync({ assignee_id: staffId });
      setShowAssignModal(false);
    } catch (error) {
      console.error("Error assigning staff:", error);
    }
  };

  const handleAssignVendor = async (vendorId: string) => {
    try {
      await assignTicket.mutateAsync({ vendor_id: vendorId });
      setShowVendorModal(false);
    } catch (error) {
      console.error("Error assigning vendor:", error);
    }
  };

  const handleAddComment = async (data: {
    comment: string;
    is_internal: boolean;
  }) => {
    try {
      await addComment.mutateAsync(data);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleUploadAttachment = async (data: {
    file: File;
    attachment_type: "photo" | "invoice" | "quote" | "other";
  }) => {
    try {
      await uploadAttachment.mutateAsync(data);
    } catch (error) {
      console.error("Error uploading attachment:", error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (confirm("Are you sure you want to delete this attachment?")) {
      try {
        await deleteAttachment.mutateAsync(attachmentId);
      } catch (error) {
        console.error("Error deleting attachment:", error);
      }
    }
  };

  const startEditingTitle = () => {
    setEditTitle(ticket?.title || "");
    setIsEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditTitle("");
  };

  const saveTitle = async () => {
    if (!editTitle.trim()) return;
    try {
      await updateTicket.mutateAsync({ title: editTitle.trim() });
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const startEditingDescription = () => {
    setEditDescription(ticket?.description || "");
    setIsEditingDescription(true);
  };

  const cancelEditingDescription = () => {
    setIsEditingDescription(false);
    setEditDescription("");
  };

  const saveDescription = async () => {
    try {
      await updateTicket.mutateAsync({ description: editDescription.trim() });
      setIsEditingDescription(false);
    } catch (error) {
      console.error("Error updating description:", error);
    }
  };

  if (ticketLoading) {
    return <PageLoader />;
  }

  if (!ticket) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Ticket not found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              The ticket you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
            <Button className="mt-6" onClick={() => router.push("/tickets")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAssigned = !!ticket.assigned_to;
  const canManage =
    currentUser?.role === "manager" || currentUser?.role === "admin";
  const isAssignedToCurrentUser = currentUser?.id === ticket.assigned_to;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/tickets")}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                #{ticket.ticket_number}
              </h1>
              <StatusBadge
                status={
                  ticket.status as Database["public"]["Enums"]["ticket_status"]
                }
              />
              {ticket.is_emergency && (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Emergency
                </Badge>
              )}
            </div>
            {isEditingTitle ? (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") cancelEditingTitle();
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveTitle}
                  disabled={updateTicket.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEditingTitle}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 group">
                <h2 className="text-xl text-gray-700">{ticket.title}</h2>
                {canManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={startEditingTitle}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusActions
              currentStatus={
                ticket.status as Database["public"]["Enums"]["ticket_status"]
              }
              userRole={
                (currentUser?.role === "super_admin"
                  ? "admin"
                  : currentUser?.role || "user") as
                  | "admin"
                  | "manager"
                  | "staff"
                  | "user"
              }
              isAssigned={isAssigned}
              onAction={handleStatusAction}
              loading={statusAction.isPending}
            />
            {canManage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignModal(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign Staff
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVendorModal(true)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Assign Vendor
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Emergency Actions */}
          {ticket.is_emergency && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Containment Status */}
                {ticket.contained_at ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <ShieldCheck className="h-5 w-5" />
                    <span>
                      Contained on{" "}
                      {format(
                        new Date(ticket.contained_at),
                        "MMM d, yyyy h:mm a",
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-red-700">
                      Emergency not yet contained
                    </span>
                    {(canManage || isAssignedToCurrentUser) &&
                      ticket.status === "submitted" && (
                        <Button
                          variant="outline"
                          className="border-amber-500 text-amber-700 hover:bg-amber-50"
                          onClick={() => handleStatusAction("contain")}
                          disabled={statusAction.isPending}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Mark Contained
                        </Button>
                      )}
                  </div>
                )}

                {/* Resolution */}
                {ticket.status === "closed" && ticket.resolution_notes ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>
                        Resolved on{" "}
                        {ticket.closed_at
                          ? format(
                              new Date(ticket.closed_at),
                              "MMM d, yyyy h:mm a",
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="rounded-md bg-white p-3">
                      <p className="text-sm font-medium text-gray-700">
                        Resolution Notes:
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {ticket.resolution_notes}
                      </p>
                    </div>
                  </div>
                ) : ticket.contained_at &&
                  (ticket.status === "in_progress" ||
                    ticket.status === "completed") ? (
                  showResolveForm ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full rounded-md border p-3 text-sm"
                        placeholder="Enter resolution notes (required)..."
                        rows={3}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            if (resolutionNotes.trim()) {
                              await statusAction.mutateAsync({
                                action: "resolve",
                                notes: resolutionNotes,
                              });
                              setShowResolveForm(false);
                              setResolutionNotes("");
                            }
                          }}
                          disabled={
                            statusAction.isPending || !resolutionNotes.trim()
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Resolve Emergency
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowResolveForm(false);
                            setResolutionNotes("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-amber-700">
                        Emergency contained, awaiting resolution
                      </span>
                      {(canManage || isAssignedToCurrentUser) && (
                        <Button
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setShowResolveForm(true)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Resolve Emergency
                        </Button>
                      )}
                    </div>
                  )
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Description</CardTitle>
              {canManage && !isEditingDescription && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startEditingDescription}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditingDescription}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveDescription}
                      disabled={updateTicket.isPending}
                    >
                      {updateTicket.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-gray-700">
                  {ticket.description || "No description provided."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Comments and Attachments */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments">
                Comments ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="attachments">
                Attachments ({attachments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="space-y-4">
              <CommentList
                comments={
                  comments as unknown as Parameters<
                    typeof CommentList
                  >[0]["comments"]
                }
                currentUserId={currentUser?.id}
              />
              <CommentForm onSubmit={handleAddComment} />
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <AttachmentGallery
                attachments={
                  attachments as unknown as Parameters<
                    typeof AttachmentGallery
                  >[0]["attachments"]
                }
                canDelete={canManage || isAssignedToCurrentUser}
                onDelete={handleDeleteAttachment}
              />
              <AttachmentUpload onUpload={handleUploadAttachment} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <Badge
                  variant={
                    ticket.priority === "critical" || ticket.priority === "high"
                      ? "destructive"
                      : "secondary"
                  }
                  className="mt-1"
                >
                  {ticket.priority}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    {ticket.location?.name || "N/A"}
                  </span>
                </div>

                {ticket.asset && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{ticket.asset.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    Submitted by{" "}
                    {ticket.submitted_by_user?.full_name || "Unknown"}
                  </span>
                </div>

                {ticket.assignee && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      Assigned to {ticket.assignee.full_name}
                    </span>
                  </div>
                )}

                {ticket.vendor && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      Vendor: {ticket.vendor.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    Created {format(new Date(ticket.created_at), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    Updated {format(new Date(ticket.updated_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {ticket.status_history && ticket.status_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline
                  statusHistory={
                    ticket.status_history as unknown as Parameters<
                      typeof StatusTimeline
                    >[0]["statusHistory"]
                  }
                  currentStatus={
                    ticket.status as Database["public"]["Enums"]["ticket_status"]
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        ticketTitle={ticket.title}
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        staffMembers={staffData || []}
        currentAssigneeId={ticket.assigned_to}
        onAssign={handleAssignStaff}
      />

      <AssignVendorModal
        ticketTitle={ticket.title}
        open={showVendorModal}
        onOpenChange={setShowVendorModal}
        vendors={
          (vendorsData || []) as unknown as Parameters<
            typeof AssignVendorModal
          >[0]["vendors"]
        }
        currentVendorId={ticket.vendor_id}
        onAssign={handleAssignVendor}
      />
    </div>
  );
}
