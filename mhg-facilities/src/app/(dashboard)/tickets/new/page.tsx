"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TicketForm } from "@/components/tickets/ticket-form";
import { useCreateTicket, useCheckDuplicates } from "@/hooks/use-tickets";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";
import type { CreateTicketData } from "@/hooks/use-tickets";

interface DuplicateTicket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  created_at: string;
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <NewTicketForm />
    </Suspense>
  );
}

function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createTicket = useCreateTicket();
  const checkDuplicates = useCheckDuplicates();

  // Pre-fill from query params (e.g. coming from asset detail page)
  const prefillAssetId = searchParams.get("asset_id") || undefined;
  const prefillLocationId = searchParams.get("location_id") || undefined;
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateTickets, setDuplicateTickets] = useState<DuplicateTicket[]>(
    [],
  );
  const [pendingData, setPendingData] = useState<CreateTicketData | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["ticket-categories"],
    queryFn: async () => {
      const response = await api.get<{
        categories: Database["public"]["Tables"]["ticket_categories"]["Row"][];
      }>("/api/ticket-categories");
      return response.categories;
    },
  });

  // Fetch locations
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await api.get<{
        locations: Database["public"]["Tables"]["locations"]["Row"][];
      }>("/api/locations");
      return response.locations;
    },
  });

  // Fetch assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const allAssets: Database["public"]["Tables"]["assets"]["Row"][] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await api.get<{
          data?: Database["public"]["Tables"]["assets"]["Row"][];
          assets?: Database["public"]["Tables"]["assets"]["Row"][];
          totalPages?: number;
        }>("/api/assets", {
          // Keep this in sync with assetFilterSchema max pageSize (100)
          params: { page, pageSize: 100 },
        });

        allAssets.push(...(response.data ?? response.assets ?? []));
        totalPages = response.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);

      // Transform to match expected type
      return allAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        serial_number: asset.serial_number,
        location_id: asset.location_id ?? "",
      }));
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    // Convert to CreateTicketData
    const ticketData: CreateTicketData = {
      title: data.title as string,
      description: data.description as string,
      category_id: data.category_id as string,
      priority: data.priority as string,
      location_id: data.location_id as string,
      asset_id: (data.asset_id as string | undefined) || null,
    };

    // Check for duplicates first
    try {
      const duplicateCheck = await checkDuplicates.mutateAsync({
        location_id: ticketData.location_id,
        asset_id: ticketData.asset_id || null,
        title: ticketData.title,
      });

      if (
        duplicateCheck.has_duplicates &&
        duplicateCheck.duplicates.length > 0
      ) {
        setDuplicateTickets(
          duplicateCheck.duplicates as unknown as DuplicateTicket[],
        );
        setPendingData(ticketData);
        setShowDuplicateWarning(true);
        return;
      }

      // No duplicates, proceed with creation
      await submitTicket(ticketData);
    } catch (error) {
      console.error("Error checking duplicates:", error);
      // If duplicate check fails, proceed anyway
      await submitTicket(ticketData);
    }
  };

  const submitTicket = async (data: CreateTicketData) => {
    try {
      const ticket = await createTicket.mutateAsync(data);
      router.push(`/tickets/${ticket.id}`);
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  const handleForceCre = async () => {
    if (pendingData) {
      await submitTicket(pendingData);
      setShowDuplicateWarning(false);
      setDuplicateTickets([]);
      setPendingData(null);
    }
  };

  if (categoriesLoading || locationsLoading || assetsLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>

      {showDuplicateWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Potential Duplicate Tickets Found</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>
              We found {duplicateTickets.length} similar ticket(s) that may be
              related to your request:
            </p>
            <div className="space-y-2">
              {duplicateTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-4">
                    <p className="font-medium">
                      #{ticket.ticket_number} - {ticket.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {ticket.status}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                      className="h-auto p-0"
                    >
                      View ticket →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDuplicateWarning(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleForceCre}>
                Create Anyway
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <TicketForm
        categories={categoriesData || []}
        locations={locationsData || []}
        assets={assetsData || []}
        defaultValues={{
          ...(prefillAssetId && { asset_id: prefillAssetId }),
          ...(prefillLocationId && { location_id: prefillLocationId }),
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/tickets")}
        isSubmitting={createTicket.isPending}
        mode="create"
      />
    </div>
  );
}
