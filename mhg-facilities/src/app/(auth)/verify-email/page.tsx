"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/loaders";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { verifyEmail } from "../actions";

// String constants for bilingual support
const STRINGS = {
  TITLE: "Verify your email",
  DESCRIPTION:
    "Check your inbox and click the verification link to activate your account",
  VERIFYING_TITLE: "Verifying...",
  VERIFYING_DESCRIPTION: "Please wait while we verify your email",
  SUCCESS_TITLE: "Email verified!",
  SUCCESS_DESCRIPTION:
    "Your email has been verified. You can now sign in to your account.",
  ERROR_TITLE: "Verification failed",
  ERROR_DESCRIPTION: "The verification link is invalid or has expired.",
  GO_TO_LOGIN: "Go to login",
  RESEND_LINK: "Resend verification email",
  SENT_TO: "Verification email sent to",
  CHECK_SPAM: "Make sure to check your spam folder",
  BACK_TO_LOGIN: "Back to login",
} as const;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<
    "pending" | "verifying" | "success" | "error"
  >("pending");

  // Get params from URL
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  useEffect(() => {
    let isMounted = true;

    async function verifyEmailToken(verificationToken: string) {
      if (!isMounted) return;
      setStatus("verifying");

      try {
        const response = await verifyEmail(verificationToken);

        if (!isMounted) return;
        if (response.error) {
          setStatus("error");
        } else {
          setStatus("success");
          // Redirect to login after a short delay
          setTimeout(() => {
            if (isMounted) {
              router.push("/login");
            }
          }, 3000);
        }
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    // If there's a token_hash and type, this is a verification callback
    if (tokenHash && type === "email") {
      verifyEmailToken(tokenHash);
    } else if (token) {
      verifyEmailToken(token);
    }

    return () => {
      isMounted = false;
    };
  }, [tokenHash, token, type, router]);

  // Verifying state
  if (status === "verifying") {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Spinner size="md" className="text-primary" />
          </div>
          <CardTitle className="text-2xl">{STRINGS.VERIFYING_TITLE}</CardTitle>
          <CardDescription>{STRINGS.VERIFYING_DESCRIPTION}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{STRINGS.SUCCESS_TITLE}</CardTitle>
          <CardDescription>{STRINGS.SUCCESS_DESCRIPTION}</CardDescription>
        </CardHeader>

        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">{STRINGS.GO_TO_LOGIN}</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="size-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{STRINGS.ERROR_TITLE}</CardTitle>
          <CardDescription>{STRINGS.ERROR_DESCRIPTION}</CardDescription>
        </CardHeader>

        <CardFooter className="flex flex-col gap-4">
          <Link href="/login" className="w-full">
            <Button className="w-full">{STRINGS.GO_TO_LOGIN}</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Pending state (waiting for user to check email)
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{STRINGS.TITLE}</CardTitle>
        <CardDescription>
          {email ? (
            <>
              {STRINGS.SENT_TO}
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </>
          ) : (
            STRINGS.DESCRIPTION
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">{STRINGS.CHECK_SPAM}</p>
      </CardContent>

      <CardFooter>
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full">
            {STRINGS.BACK_TO_LOGIN}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </CardContent>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
