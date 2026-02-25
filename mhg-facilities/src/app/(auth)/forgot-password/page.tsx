"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { Spinner } from "@/components/ui/loaders";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api-client";

// String constants for bilingual support
const STRINGS = {
  TITLE: "Reset your password",
  DESCRIPTION:
    "Enter your email address and we'll send you a link to reset your password",
  EMAIL_LABEL: "Email address",
  EMAIL_PLACEHOLDER: "you@company.com",
  SEND_RESET_LINK: "Send reset link",
  SENDING: "Sending...",
  BACK_TO_LOGIN: "Back to login",
  SUCCESS_TITLE: "Check your email",
  SUCCESS_DESCRIPTION: "We've sent a password reset link to",
  ERROR_INVALID_EMAIL: "Please enter a valid email address",
} as const;

// Zod schema for form validation
const forgotPasswordSchema = z.object({
  email: z.string().email(STRINGS.ERROR_INVALID_EMAIL),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    // Validate with Zod
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: { email?: string } = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === "email") fieldErrors.email = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email });
      setSubmittedEmail(email);
      setIsSuccess(true);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{STRINGS.SUCCESS_TITLE}</CardTitle>
          <CardDescription>
            {STRINGS.SUCCESS_DESCRIPTION}
            <br />
            <span className="font-medium text-foreground">
              {submittedEmail}
            </span>
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="size-4" />
              {STRINGS.BACK_TO_LOGIN}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{STRINGS.TITLE}</CardTitle>
        <CardDescription>{STRINGS.DESCRIPTION}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{STRINGS.EMAIL_LABEL}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={STRINGS.EMAIL_PLACEHOLDER}
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" />
                {STRINGS.SENDING}
              </>
            ) : (
              STRINGS.SEND_RESET_LINK
            )}
          </Button>

          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="size-4" />
              {STRINGS.BACK_TO_LOGIN}
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
