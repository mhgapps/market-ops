"use client";

import { ReactNode } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { statusColors } from "@/theme/colors";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/database";

interface KanbanColumnProps {
  status: TicketStatus;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ status, count, children }: KanbanColumnProps) {
  const config = statusColors[status];

  return (
    <div className="flex flex-col min-w-[85vw] sm:min-w-[280px] max-w-[320px] flex-1">
      {/* Column Header */}
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        {/* Status dot */}
        <div
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.dot }}
        />
        {/* Status label */}
        <span className="text-sm font-medium text-slate-700">
          {config.label}
        </span>
        {/* Count */}
        <span className="text-xs font-medium text-slate-400 ml-auto">
          {count}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-lg p-2 min-h-[200px] transition-colors duration-200",
              snapshot.isDraggingOver
                ? "bg-blue-50/70 ring-2 ring-blue-200/50 ring-inset"
                : "bg-slate-50/50",
            )}
          >
            <div className="space-y-2">
              {children}
              {provided.placeholder}
            </div>

            {/* Empty state */}
            {!snapshot.isDraggingOver && count === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div
                  className="h-8 w-8 rounded-full mb-2 opacity-30"
                  style={{ backgroundColor: config.dot }}
                />
                <p className="text-xs text-slate-400">No tickets</p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  Drag tickets here
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
