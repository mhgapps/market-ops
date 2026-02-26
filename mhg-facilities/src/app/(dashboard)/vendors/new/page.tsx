"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import {
  VendorForm,
  type VendorFormHandle,
} from "@/components/vendors/vendor-form";
import { useCreateVendor } from "@/hooks/use-vendors";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/loaders";
import Link from "next/link";
import { toast } from "sonner";

export default function NewVendorPage() {
  const router = useRouter();
  const createVendor = useCreateVendor();
  const formRef = useRef<VendorFormHandle>(null);

  const handleSubmit = async (
    data: Parameters<typeof createVendor.mutateAsync>[0],
  ) => {
    try {
      const vendor = await createVendor.mutateAsync(data);
      toast.success("Vendor created successfully");
      router.push(`/vendors/${vendor.id}`);
    } catch (_error) {
      toast.error("Failed to create vendor");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Add New Vendor</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push("/vendors")}
            disabled={createVendor.isPending}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => formRef.current?.submit()}
            disabled={createVendor.isPending}
          >
            {createVendor.isPending && <Spinner size="sm" className="mr-2" />}
            Create Vendor
          </Button>
        </div>
      </div>

      <VendorForm
        ref={formRef}
        onSubmit={handleSubmit}
        isSubmitting={createVendor.isPending}
        mode="create"
      />
    </div>
  );
}
