import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Trash2, AlertCircle, Loader2, Box } from "lucide-react";
import { FirebaseService } from "@/services/firebaseService";
import { getCurrentUserId } from "@/config/firebase";

const StatItem = ({ label, value, icon: Icon, loading }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 hover:shadow-md transition-all">
    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
      <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shadow-md">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span>{label}</span>
    </div>
    {loading ? (
      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
    ) : (
      <span className="font-bold text-xl text-purple-700 dark:text-purple-300">{value}</span>
    )}
  </div>
);

export default function UsageStats() {
  const [stats, setStats] = useState({
    smartBins: 0,
    singleBins: 0,
    compartments: 0,
    alertsThisMonth: 0,
    totalAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.warn('No user ID found');
        setLoading(false);
        return;
      }

      // Fetch data in parallel
      const [smartBins, singleBins, compartments, alerts] = await Promise.all([
        FirebaseService.getSmartBins(userId),
        FirebaseService.getSingleBins(userId),
        FirebaseService.getCompartments(userId),
        FirebaseService.getAlerts(userId)
      ]);

      // Calculate alerts this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const alertsThisMonth = alerts.filter(alert => {
        const alertDate = new Date(alert.created_at || alert.timestamp);
        return alertDate >= startOfMonth;
      }).length;

      setStats({
        smartBins: smartBins.length,
        singleBins: singleBins.length,
        compartments: compartments.length,
        alertsThisMonth,
        totalAlerts: alerts.length
      });
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-xl border-2 border-purple-200 dark:border-purple-700 dark:bg-[#241B3A]">
      <CardHeader className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white border-b-4 border-indigo-300 dark:border-indigo-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg shadow-lg border border-white/30">
              <BarChart className="w-5 h-5 text-white" />
            </div>
            Usage Statistics
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/10 dark:via-[#1a1325] dark:to-purple-950/10">
        <StatItem 
          label="Smart Bins" 
          value={stats.smartBins} 
          icon={Box} 
          loading={loading}
        />
        <StatItem 
          label="Single Bins" 
          value={stats.singleBins} 
          icon={Trash2} 
          loading={loading}
        />
        <StatItem 
          label="Compartments" 
          value={stats.compartments} 
          icon={Box} 
          loading={loading}
        />
        <div className="border-t-2 border-gradient-to-r from-purple-200 via-blue-200 to-indigo-200 dark:from-purple-700 dark:via-blue-700 dark:to-indigo-700 my-2" />
        <StatItem 
          label="Alerts This Month" 
          value={stats.alertsThisMonth} 
          icon={AlertCircle} 
          loading={loading}
        />
        <StatItem 
          label="Total Alerts" 
          value={stats.totalAlerts} 
          icon={AlertCircle} 
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}