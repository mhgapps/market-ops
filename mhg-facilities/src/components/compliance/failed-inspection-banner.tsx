import { XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FailedInspectionBannerProps {
  correctiveAction: string;
  reinspectionDate: string;
  failedDate: string;
}

export function FailedInspectionBanner({
  correctiveAction,
  reinspectionDate,
  failedDate,
}: FailedInspectionBannerProps) {
  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Failed Inspection</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          <strong>Failed on:</strong>{" "}
          {new Date(failedDate).toLocaleDateString()}
        </p>
        <p className="mb-2">
          <strong>Corrective Action Required:</strong> {correctiveAction}
        </p>
        <p>
          <strong>Reinspection Date:</strong>{" "}
          {new Date(reinspectionDate).toLocaleDateString()}
        </p>
      </AlertDescription>
    </Alert>
  );
}
