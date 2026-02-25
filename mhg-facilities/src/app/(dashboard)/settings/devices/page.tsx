"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Monitor, Smartphone, Tablet, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageLoader } from "@/components/ui/loaders";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api-client";

interface DeviceInfo {
  id: string;
  device_name: string | null;
  ip_address: string | null;
  trusted_at: string;
  last_used_at: string;
  is_current: boolean;
}

function DeviceIcon({
  deviceName,
  className,
}: {
  deviceName: string | null;
  className?: string;
}) {
  const name = (deviceName ?? "").toLowerCase();
  if (
    name.includes("iphone") ||
    name.includes("ios") ||
    name.includes("android")
  ) {
    return <Smartphone className={className} />;
  }
  if (name.includes("ipad")) {
    return <Tablet className={className} />;
  }
  return <Monitor className={className} />;
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DeviceCard({
  device,
  onRevoke,
  isRevoking,
}: {
  device: DeviceInfo;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <DeviceIcon
              deviceName={device.device_name}
              className="h-5 w-5 text-primary"
            />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm">
                {device.device_name ?? "Unknown device"}
              </span>
              {device.is_current && (
                <Badge variant="secondary" className="text-xs">
                  This device
                </Badge>
              )}
            </div>
            {device.ip_address && (
              <p className="text-xs text-muted-foreground">
                IP: {device.ip_address}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Trusted: {formatDate(device.trusted_at)}</span>
              <span>Last used: {formatDate(device.last_used_at)}</span>
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isRevoking}
              className="min-h-[44px] min-w-[44px] self-end sm:self-center"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {device.is_current ? "Sign out" : "Revoke"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {device.is_current
                  ? "Sign out of this device?"
                  : "Revoke device trust?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {device.is_current
                  ? "You will be signed out and need to log in again."
                  : `This will remove trust from "${device.device_name ?? "Unknown device"}". That device will need to sign in again.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-[44px]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRevoke(device.id)}
                className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
              >
                {device.is_current ? "Sign out" : "Revoke"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function TrustedDevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      const { devices: data } = await api.get<{ devices: DeviceInfo[] }>(
        "/api/auth/devices",
      );
      setDevices(data);
    } catch {
      toast.error("Failed to load devices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  async function handleRevokeSingle(deviceId: string) {
    const device = devices.find((d) => d.id === deviceId);
    setRevokingId(deviceId);
    try {
      await api.delete(`/api/auth/devices/${deviceId}`);
      if (device?.is_current) {
        toast.success("Signed out");
        router.push("/login");
        return;
      }
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      toast.success("Device revoked");
    } catch {
      toast.error("Failed to revoke device");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    setIsRevokingAll(true);
    try {
      await api.delete("/api/auth/devices");
      toast.success("All devices revoked");
      router.push("/login");
    } catch {
      toast.error("Failed to revoke devices");
      setIsRevokingAll(false);
    }
  }

  if (isLoading) {
    return <PageLoader text="Loading devices..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 md:text-3xl">
            <Shield className="h-7 w-7 md:h-8 md:w-8" />
            Trusted Devices
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Devices that can sign in without your password. Each device is
            trusted for 180 days.
          </p>
        </div>

        {devices.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isRevokingAll}
                className="min-h-[44px] min-w-[44px] self-start"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Revoke All Devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke all trusted devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign you out of all devices, including this one. You
                  will need to log in again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-[44px]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRevokeAll}
                  className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
                >
                  Revoke All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {devices.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Shield className="h-10 w-10" />}
            title="No trusted devices"
            description="When you sign in, your device will be trusted for 180 days."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onRevoke={handleRevokeSingle}
              isRevoking={revokingId === device.id || isRevokingAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}
