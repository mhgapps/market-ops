"use client";

import { forwardRef } from "react";
import { AlertTriangle } from "lucide-react";
import { priorityColors } from "@/theme/colors";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  id: string;
  ticketNumber: number;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  locationName?: string | null;
  isEmergency?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  className?: string;
}

export const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  (
    {
      ticketNumber,
      title,
      priority,
      locationName,
      isEmergency,
      isDragging,
      onClick,
      className,
      ...props
    },
    ref,
  ) => {
    const priorityConfig = priorityColors[priority];

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "group relative cursor-pointer rounded-lg border bg-white transition-all duration-150",
          "hover:shadow-md hover:border-slate-300",
          isDragging && "shadow-lg ring-2 ring-primary/20 rotate-[2deg]",
          className,
        )}
        style={{
          borderLeftWidth: "3px",
          borderLeftColor: priorityConfig.border,
          boxShadow: isDragging
            ? "0 8px 16px -2px rgb(0 0 0 / 0.1)"
            : "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        }}
        {...props}
      >
        <div className="p-3">
          {/* Header row: Ticket number + Emergency indicator */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 tracking-wide">
              #{ticketNumber}
            </span>
            {isEmergency && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                <AlertTriangle className="h-3 w-3" />
                URGENT
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-slate-900">
            {title}
          </h3>

          {/* Footer: Location + Assignee */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
            {/* Location */}
            {locationName ? (
              <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                {locationName}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                No location
              </span>
            )}

            {/* Priority label + Assignee */}
            <div className="flex items-center gap-2">
              {/* Priority pill label */}
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: priorityConfig.bg,
                  color: priorityConfig.text,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: priorityConfig.dot }}
                />
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

KanbanCard.displayName = "KanbanCard";
