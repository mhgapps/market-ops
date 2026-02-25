import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standardized loader components for MHG Facilities
 *
 * Usage:
 * - PageLoader: Full-page loading state (centered in viewport)
 * - Spinner: Inline spinner for buttons, cards, etc.
 * - ButtonLoader: Text + spinner combo for button loading states
 *
 * All components use consistent sizing and colors from the design system.
 */

interface SpinnerProps {
  /** Size variant: 'sm' (16px), 'md' (24px), 'lg' (32px) */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

/**
 * Inline spinner component
 *
 * @example
 * <Spinner size="sm" />
 * <Spinner size="lg" className="text-primary" />
 */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-muted-foreground",
        sizeClasses[size],
        className,
      )}
    />
  );
}

interface PageLoaderProps {
  /** Height of the container: 'full' (100vh), 'half' (50vh), 'auto' (min-h-[200px]) */
  height?: "full" | "half" | "auto";
  /** Loading text to display below spinner */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Full-page loading spinner (centered)
 *
 * @example
 * if (isLoading) return <PageLoader />
 * if (isLoading) return <PageLoader text="Loading tickets..." />
 * if (isLoading) return <PageLoader height="auto" />
 */
export function PageLoader({
  height = "half",
  text,
  className,
}: PageLoaderProps) {
  const heightClasses = {
    full: "h-screen",
    half: "h-[50vh]",
    auto: "min-h-[200px]",
  } as const;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        heightClasses[height],
        className,
      )}
    >
      <Spinner size="lg" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

interface ButtonLoaderProps {
  /** Text to display when loading */
  loadingText?: string;
  /** Text to display when not loading */
  children: React.ReactNode;
  /** Whether currently loading */
  isLoading: boolean;
}

/**
 * Button content with loading state
 *
 * @example
 * <Button disabled={isSubmitting}>
 *   <ButtonLoader isLoading={isSubmitting} loadingText="Saving...">
 *     Save Changes
 *   </ButtonLoader>
 * </Button>
 */
export function ButtonLoader({
  loadingText,
  children,
  isLoading,
}: ButtonLoaderProps) {
  if (isLoading) {
    return (
      <>
        <Spinner size="sm" className="mr-2" />
        {loadingText || children}
      </>
    );
  }
  return <>{children}</>;
}

// Re-export skeleton components for convenience
export { Skeleton } from "./skeleton";
export {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
  CardSkeleton,
} from "./skeletons";
