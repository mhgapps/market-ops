import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  href?: string;
  description?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  href,
  description,
}: StatCardProps) {
  const content = (
    <Card className={href ? 'cursor-pointer transition-colors hover:bg-accent' : ''}>
      {/* Mobile: Compact horizontal layout */}
      <CardContent className="p-3 md:hidden">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-lg font-bold leading-tight">{value}</p>
          </div>
          {(change !== undefined || description) && (
            <div className="flex-shrink-0 text-right">
              {change !== undefined && (
                <div
                  className={`flex items-center gap-0.5 text-xs ${
                    trend === 'up'
                      ? 'text-green-600'
                      : trend === 'down'
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {trend === 'up' && <ArrowUp className="h-3 w-3" />}
                  {trend === 'down' && <ArrowDown className="h-3 w-3" />}
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
              {description && (
                <p className="text-[10px] text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Desktop: Original vertical layout */}
      <div className="hidden md:block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {(change !== undefined || description) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {change !== undefined && (
                <div
                  className={`flex items-center gap-1 ${
                    trend === 'up'
                      ? 'text-green-600'
                      : trend === 'down'
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {trend === 'up' && <ArrowUp className="h-3 w-3" />}
                  {trend === 'down' && <ArrowDown className="h-3 w-3" />}
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
              {description && <span>{description}</span>}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
