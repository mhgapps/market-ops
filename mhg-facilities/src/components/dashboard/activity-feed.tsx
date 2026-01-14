import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Wrench,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'ticket_created' | 'ticket_completed' | 'compliance_expiring' | 'pm_completed';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  linkUrl?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
}

const ACTIVITY_ICONS: Record<string, typeof FileText> = {
  ticket_created: FileText,
  ticket_completed: CheckCircle2,
  compliance_expiring: AlertTriangle,
  pm_completed: Wrench,
};

const ACTIVITY_COLORS: Record<string, string> = {
  ticket_created: 'text-blue-600',
  ticket_completed: 'text-green-600',
  compliance_expiring: 'text-amber-600',
  pm_completed: 'text-purple-600',
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function ActivityFeed({ activities, title = 'Recent Activity' }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type];
              const colorClass = ACTIVITY_COLORS[activity.type];

              const content = (
                <div className="flex gap-3">
                  <div className={`mt-0.5 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );

              if (activity.linkUrl) {
                return (
                  <Link
                    key={activity.id}
                    href={activity.linkUrl}
                    className="block rounded-lg p-3 transition-colors hover:bg-accent"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div key={activity.id} className="p-3">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
