"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Save } from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettingsPage() {
  const [emailTicketAssigned, setEmailTicketAssigned] = useState(true);
  const [emailTicketStatusChange, setEmailTicketStatusChange] = useState(true);
  const [emailPMDue, setEmailPMDue] = useState(true);
  const [emailComplianceExpiring, setEmailComplianceExpiring] = useState(true);
  const [emailDailyDigest, setEmailDailyDigest] = useState(false);

  const handleSave = () => {
    // TODO: Persist to user preferences in database
    toast.success("Notification settings saved");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Notification Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your email notification preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Notifications</CardTitle>
          <CardDescription>
            Get notified about ticket assignments and status changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-ticket-assigned">Ticket Assigned</Label>
              <p className="text-sm text-muted-foreground">
                Receive an email when a ticket is assigned to you
              </p>
            </div>
            <Switch
              id="email-ticket-assigned"
              checked={emailTicketAssigned}
              onCheckedChange={setEmailTicketAssigned}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-ticket-status">Ticket Status Changes</Label>
              <p className="text-sm text-muted-foreground">
                Get updates when ticket status changes
              </p>
            </div>
            <Switch
              id="email-ticket-status"
              checked={emailTicketStatusChange}
              onCheckedChange={setEmailTicketStatusChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Notifications</CardTitle>
          <CardDescription>
            Preventive maintenance task reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-pm-due">PM Tasks Due</Label>
              <p className="text-sm text-muted-foreground">
                Remind me when preventive maintenance tasks are due
              </p>
            </div>
            <Switch
              id="email-pm-due"
              checked={emailPMDue}
              onCheckedChange={setEmailPMDue}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Notifications</CardTitle>
          <CardDescription>Document expiration alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-compliance">Documents Expiring</Label>
              <p className="text-sm text-muted-foreground">
                Alert me when compliance documents are expiring soon
              </p>
            </div>
            <Switch
              id="email-compliance"
              checked={emailComplianceExpiring}
              onCheckedChange={setEmailComplianceExpiring}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Digest Notifications</CardTitle>
          <CardDescription>Daily summary emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-digest">Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a daily summary of all activity
              </p>
            </div>
            <Switch
              id="email-digest"
              checked={emailDailyDigest}
              onCheckedChange={setEmailDailyDigest}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
