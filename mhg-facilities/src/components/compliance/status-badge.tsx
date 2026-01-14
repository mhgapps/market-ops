import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'active' | 'expiring_soon' | 'expired' | 'pending_renewal' | 'conditional' | 'failed_inspection' | 'suspended';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    active: { variant: 'default' as const, label: 'Active' },
    expiring_soon: { variant: 'warning' as const, label: 'Expiring Soon' },
    expired: { variant: 'destructive' as const, label: 'Expired' },
    pending_renewal: { variant: 'secondary' as const, label: 'Pending Renewal' },
    conditional: { variant: 'warning' as const, label: 'Conditional' },
    failed_inspection: { variant: 'destructive' as const, label: 'Failed Inspection' },
    suspended: { variant: 'destructive' as const, label: 'Suspended' },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
