interface ExpirationCountdownProps {
  expirationDate: string;
}

export function ExpirationCountdown({
  expirationDate,
}: ExpirationCountdownProps) {
  const expDate = new Date(expirationDate);
  const today = new Date();
  const daysUntil = Math.ceil(
    (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  let colorClass = "text-muted-foreground";
  let message = "";

  if (daysUntil < 0) {
    colorClass = "text-destructive";
    message = `Expired ${Math.abs(daysUntil)} days ago`;
  } else if (daysUntil === 0) {
    colorClass = "text-destructive";
    message = "Expires today";
  } else if (daysUntil <= 7) {
    colorClass = "text-destructive";
    message = `Expires in ${daysUntil} days`;
  } else if (daysUntil <= 30) {
    colorClass = "text-amber-600";
    message = `Expires in ${daysUntil} days`;
  } else if (daysUntil <= 90) {
    colorClass = "text-yellow-600";
    message = `Expires in ${daysUntil} days`;
  } else {
    colorClass = "text-muted-foreground";
    message = `Expires in ${daysUntil} days`;
  }

  return <div className={`text-sm font-medium ${colorClass}`}>{message}</div>;
}
