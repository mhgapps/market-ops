"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useComplianceCalendar } from "@/hooks/use-compliance";
import { useState } from "react";

interface ComplianceCalendarProps {
  locationId?: string;
}

export function ComplianceCalendar({
  locationId: _locationId,
}: ComplianceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { data: calendarData, isLoading } = useComplianceCalendar(month, year);

  // Create a map of dates with expirations
  const expirationDates = new Set<string>();
  const dateDetails: Record<
    string,
    Array<{ name: string; status: string }>
  > = {};

  if (calendarData) {
    calendarData.forEach((doc) => {
      const dateKey = new Date(doc.expiration_date).toISOString().split("T")[0];
      expirationDates.add(dateKey);

      if (!dateDetails[dateKey]) {
        dateDetails[dateKey] = [];
      }
      dateDetails[dateKey].push({
        name: doc.name,
        status: doc.status,
      });
    });
  }

  const modifiers = {
    expiring: (date: Date) => {
      const dateKey = date.toISOString().split("T")[0];
      return expirationDates.has(dateKey);
    },
  };

  const modifiersClassNames = {
    expiring: "bg-amber-100 text-amber-900 font-bold",
  };

  const selectedDateKey = selectedDate.toISOString().split("T")[0];
  const selectedDateDocs = dateDetails[selectedDateKey] || [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Expiration Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border"
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Highlighted dates have documents expiring</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : selectedDateDocs.length > 0 ? (
            <div className="space-y-3">
              {selectedDateDocs.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-medium">{doc.name}</span>
                  <Badge
                    variant={
                      doc.status === "expired"
                        ? "destructive"
                        : doc.status === "expiring_soon"
                          ? "warning"
                          : "default"
                    }
                  >
                    {doc.status === "expired"
                      ? "Expired"
                      : doc.status === "expiring_soon"
                        ? "Expiring"
                        : doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No documents expiring on this date
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
