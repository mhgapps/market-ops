"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
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
import { resetPassword } from "../actions";

// String constants for bilingual support
const STRINGS = {
  TITLE: "Set new password",
  DESCRIPTION: "Enter your new password below",
  PASSWORD_LABEL: "New password",
  PASSWORD_PLACEHOLDER: "Create a strong password",
  CONFIRM_PASSWORD_LABEL: "Confirm password",
  CONFIRM_PASSWORD_PLACEHOLDER: "Confirm your new password",
  RESET_PASSWORD: "Reset password",
  RESETTING: "Resetting...",
  BACK_TO_LOGIN: "Back to login",
  SUCCESS_TITLE: "Password reset successful",
  SUCCESS_DESCRIPTION:
    "Your password has been reset. You can now log in with your new password.",
  GO_TO_LOGIN: "Go to login",
  ERROR_INVALID_TOKEN:
    "Invalid or expired reset link. Please request a new one.",
  ERROR_PASSWORD_MIN: "Password must be at least 8 characters",
  ERROR_PASSWORD_WEAK:
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  ERROR_PASSWORDS_DONT_MATCH: "Passwords do not match",
} as const;

// Zod schema for form validation
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, STRINGS.ERROR_PASSWORD_MIN)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, STRINGS.ERROR_PASSWORD_WEAK),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: STRINGS.ERROR_PASSWORDS_DONT_MATCH,
    path: ["confirmPassword"],
  });

type FormErrors = {
  password?: string;
  confirmPassword?: string;
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Get the code/token from URL (Supabase sends it as 'code')
  const code = searchParams.get("code");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (!code) {
      toast.error(STRINGS.ERROR_INVALID_TOKEN);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate with Zod
    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword(code, password);

      if (response.error) {
        toast.error(response.error);
      } else {
        setIsSuccess(true);
      }
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
            <CheckCircle className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{STRINGS.SUCCESS_TITLE}</CardTitle>
          <CardDescription>{STRINGS.SUCCESS_DESCRIPTION}</CardDescription>
        </CardHeader>

        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/login")}>
            {STRINGS.GO_TO_LOGIN}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!code) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl text-destructive">
            Invalid Link
          </CardTitle>
          <CardDescription>{STRINGS.ERROR_INVALID_TOKEN}</CardDescription>
        </CardHeader>

        <CardFooter className="flex flex-col gap-4">
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">Request new reset link</Button>
          </Link>

          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
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
            <Label htmlFor="password">{STRINGS.PASSWORD_LABEL}</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={STRINGS.PASSWORD_PLACEHOLDER}
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {STRINGS.CONFIRM_PASSWORD_LABEL}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={STRINGS.CONFIRM_PASSWORD_PLACEHOLDER}
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={!!errors.confirmPassword}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" />
                {STRINGS.RESETTING}
              </>
            ) : (
              STRINGS.RESET_PASSWORD
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

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
