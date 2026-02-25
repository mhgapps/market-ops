"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/api-client";

interface InvitationData {
  email: string;
  role: string;
  tenantName: string;
  expiresAt: string;
}

interface AcceptResponse {
  user: unknown;
  session: unknown | null;
}

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
  });

  useEffect(() => {
    async function loadInvitation() {
      try {
        const data = await api.get<{ invitation: InvitationData }>(
          `/api/invitations/${resolvedParams.token}`,
        );
        setInvitation(data.invitation);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Invalid or expired invitation",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [resolvedParams.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setSubmitting(true);

    try {
      const response = await api.post<AcceptResponse>(
        `/api/invitations/${resolvedParams.token}`,
        { full_name: formData.fullName },
      );

      if (response.session) {
        router.push("/set-password");
      } else {
        setAccountCreated(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/login")}
              className="w-full min-h-[44px]"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accountCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Account Created</CardTitle>
            <CardDescription>
              Please set your password to complete your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full min-h-[44px]">
              <Link href="/set-password">Set Password</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join{" "}
            <strong>{invitation?.tenantName}</strong> as a{" "}
            <strong>{invitation?.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
                placeholder="Enter your full name"
              />
            </div>

            <Button
              type="submit"
              className="w-full min-h-[44px]"
              disabled={submitting}
            >
              {submitting ? "Joining..." : "Join Team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
