import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConditionalBannerProps {
  requirements: string;
  deadline: string;
}

export function ConditionalBanner({
  requirements,
  deadline,
}: ConditionalBannerProps) {
  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Conditional Approval</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          <strong>Requirements:</strong> {requirements}
        </p>
        <p>
          <strong>Deadline:</strong> {new Date(deadline).toLocaleDateString()}
        </p>
      </AlertDescription>
    </Alert>
  );
}
