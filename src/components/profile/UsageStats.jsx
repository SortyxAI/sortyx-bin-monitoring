import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Trash2, AlertCircle } from "lucide-react";

const StatItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    <span className="font-bold">{value}</span>
  </div>
);

export default function UsageStats() {
  return (
    <Card className="dark:bg-[#241B3A] dark:border-purple-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Usage Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatItem label="SmartBins Monitored" value={3} icon={Trash2} />
        <StatItem label="Alerts this month" value={12} icon={AlertCircle} />
        <p className="text-xs text-center text-gray-400 pt-2">
          More detailed statistics coming soon.
        </p>
      </CardContent>
    </Card>
  );
}