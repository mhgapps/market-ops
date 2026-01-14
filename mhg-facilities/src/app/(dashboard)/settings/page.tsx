import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Bell,
  Tags,
  Users,
  ChevronRight,
} from 'lucide-react';

export default function SettingsPage() {
  const settingsSections = [
    {
      title: 'Tenant Settings',
      description: 'Manage organization name, branding, and preferences',
      icon: Building2,
      href: '/settings/tenant',
    },
    {
      title: 'Notifications',
      description: 'Configure email, SMS, and push notification preferences',
      icon: Bell,
      href: '/settings/notifications',
    },
    {
      title: 'Categories',
      description: 'Manage ticket and asset categories',
      icon: Tags,
      href: '/settings/categories',
    },
    {
      title: 'Team Members',
      description: 'Invite and manage team members',
      icon: Users,
      href: '/users',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="hover:bg-accent transition-colors">
              <Link href={section.href}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
