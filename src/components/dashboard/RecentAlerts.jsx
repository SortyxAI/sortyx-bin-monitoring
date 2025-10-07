import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function RecentAlerts({ alerts }) {
  const sortedAlerts = (alerts || []).slice(0, 5);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700';
      default: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <Card className="bg-white/70 dark:bg-[#241B3A]/70 backdrop-blur-sm border-gray-200 dark:border-purple-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Recent Alerts
          </CardTitle>
          <Link to={createPageUrl("Alerts")}>
            <Button variant="outline" size="sm" className="dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-700">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No active alerts</p>
            <p className="text-xs mt-1">All systems running normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50/80 to-purple-50/50 dark:from-[#2A1F3D]/50 dark:to-[#1F1235]/50 hover:from-gray-100/80 hover:to-purple-100/60 dark:hover:from-[#2A1F3D]/70 dark:hover:to-[#1F1235]/70 transition-all duration-200 border border-gray-100 dark:border-purple-700/30"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${getSeverityColor(alert.severity)} border`}>
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(alert.timestamp), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {alert.binName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {alert.message}
                  </p>
                  {alert.currentValue !== null && alert.threshold !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {alert.currentValue}{alert.unit} / {alert.threshold}{alert.unit}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}