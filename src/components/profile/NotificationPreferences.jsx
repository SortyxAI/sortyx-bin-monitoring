import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";

export default function NotificationPreferences({ user, onUpdate }) {
  const handleToggle = (enabled) => {
    onUpdate({ notifications_enabled: enabled });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-600" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="notifications-switch" className="flex-1">
            <p className="font-medium">Enable Email & SMS Alerts</p>
            <p className="text-sm text-gray-500">
              Receive alerts when bin thresholds are met.
            </p>
          </Label>
          <Switch
            id="notifications-switch"
            checked={user.notifications_enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}