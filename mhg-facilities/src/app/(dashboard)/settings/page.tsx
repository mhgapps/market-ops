import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Bell,
  Tags,
  Users,
  MapPin,
  BarChart3,
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
      title: 'Locations',
      description: 'Manage facility locations and addresses',
      icon: MapPin,
      href: '/settings/locations',
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
    {
      title: 'Reports',
      description: 'View analytics and generate reports',
      icon: BarChart3,
      href: '/reports',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>

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
