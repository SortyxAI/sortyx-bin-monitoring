import React, { useState, useEffect } from "react";
import { FirebaseService } from "@/services/firebaseService";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Bell, 
  Check, 
  Search,
  Filter,
  Calendar,
  Clock,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    // Auto-generate alerts every 5 minutes
    const interval = setInterval(() => {
      generateAlerts();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alertData = await FirebaseService.getAlerts();
      setAlerts(alertData);
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async () => {
    try {
      setGenerating(true);
      const newAlerts = await FirebaseService.generateAlertsForBins();
      if (newAlerts.length > 0) {
        toast({
          title: "New Alerts",
          description: `Generated ${newAlerts.length} new alert(s)`,
        });
        await loadAlerts();
      }
    } catch (error) {
      console.error("Error generating alerts:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await FirebaseService.acknowledgeAlert(alertId);
      toast({
        title: "Success",
        description: "Alert acknowledged",
      });
      await loadAlerts();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive"
      });
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = 
      filter === 'all' || 
      alert.severity === filter ||
      (filter === 'unacknowledged' && !alert.acknowledged) ||
      (filter === 'acknowledged' && alert.acknowledged);
    
    const matchesSearch = !searchTerm || 
      alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.binName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.type?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <Bell className="w-5 h-5 text-yellow-600" />;
      default: return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-purple-200">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
      <h1 className="text-3xl max-[500px]:text-2xl font-bold mb-2 text-gray-900 dark:text-white ">Alert Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Monitor and manage system alerts and notifications</p>
        </div>
        <Button 
          onClick={generateAlerts}
          disabled={generating}
          className="gap-2  text-white bg-gradient-to-r from-purple-600 to-indigo-600 
          dark:from-pink-400 dark:to-fuchsia-500 dark:text-gray-100 "
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          Check for Alerts
        </Button>
      </motion.div>

      {/* Filters */}
      <Card className="mb-6 bg-gradient-to-br from-white to-purple-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-purple-200 dark:border-purple-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-900 dark:text-yellow-300"/>
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-gray-900 placeholder:text-black dark:placeholder:text-[#fae505]"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-white to-red-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-red-200 dark:border-red-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-purple-200">Critical</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-orange-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-orange-200 dark:border-orange-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {alerts.filter(a => a.severity === 'high' && !a.acknowledged).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-purple-200">High</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-purple-300">
              {alerts.filter(a => !a.acknowledged).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-purple-200">Unacknowledged</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-white to-green-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-green-200 dark:border-green-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {alerts.filter(a => a.acknowledged).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-purple-200">Acknowledged</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-purple-200 dark:border-purple-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-purple-100 mb-2">
              {searchTerm || filter !== 'all' ? 'No matching alerts' : 'No alerts found'}
            </h3>
            <p className="text-gray-500 dark:text-purple-200 text-center">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'All systems are running normally. Click "Check for Alerts" to scan for new issues.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`transition-all duration-300 ${
                  alert.severity === 'critical' && !alert.acknowledged 
                    ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/40 border-2 border-red-500 dark:border-red-400 shadow-xl shadow-red-500/20'
                    : 'bg-gradient-to-br from-white to-purple-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-purple-200 dark:border-purple-700'
                } ${alert.acknowledged ? 'opacity-75' : ''}`}>
                  <CardContent className="p-6 relative overflow-hidden">
                    {/* ✅ NEW: Flashing red border animation for critical alerts */}
                    {alert.severity === 'critical' && !alert.acknowledged && (
                      <>
                        <motion.div
                          className="absolute inset-0 border-4 border-red-500 rounded-lg pointer-events-none"
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.98, 1, 0.98]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500"
                          animate={{
                            opacity: [1, 0.3, 1],
                            scaleX: [1, 0.95, 1]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </>
                    )}

                    <div className="flex items-start gap-4 relative z-10">
                      <div className="flex-shrink-0 mt-1">
                        {alert.severity === 'critical' && !alert.acknowledged ? (
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              rotate: [0, 10, -10, 0]
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            {getSeverityIcon(alert.severity)}
                          </motion.div>
                        ) : (
                          getSeverityIcon(alert.severity)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {alert.severity === 'critical' && !alert.acknowledged ? (
                            <motion.div
                              animate={{
                                scale: [1, 1.05, 1],
                                boxShadow: [
                                  '0 0 0 0 rgba(239, 68, 68, 0.7)',
                                  '0 0 0 8px rgba(239, 68, 68, 0)',
                                  '0 0 0 0 rgba(239, 68, 68, 0)'
                                ]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <Badge className={`${getSeverityColor(alert.severity)} border-2 border-red-600 font-bold text-sm px-3 py-1`}>
                                🚨 {alert.severity.toUpperCase()}
                              </Badge>
                            </motion.div>
                          ) : (
                            <Badge className={`${getSeverityColor(alert.severity)} border`}>
                              {alert.severity}
                            </Badge>
                          )}
                          <Badge variant="outline" className={alert.severity === 'critical' ? 'border-red-400 text-red-700 dark:text-red-300' : ''}>
                            {alert.alert_type?.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {alert.binType && (
                            <Badge variant="secondary" className={alert.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200' : ''}>
                              {alert.binType}
                            </Badge>
                          )}
                          {alert.acknowledged && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200">
                              ✓ Acknowledged
                            </Badge>
                          )}
                        </div>

                        <h3 className={`font-semibold mb-1 ${
                          alert.severity === 'critical' && !alert.acknowledged
                            ? 'text-red-800 dark:text-red-200 text-lg'
                            : 'text-gray-900 dark:text-purple-100'
                        }`}>
                          {alert.binName}
                        </h3>
                        
                        <p className={`mb-2 ${
                          alert.severity === 'critical' && !alert.acknowledged
                            ? 'text-red-700 dark:text-red-200 font-medium'
                            : 'text-gray-700 dark:text-purple-200'
                        }`}>
                          {alert.message}
                        </p>
                        
                        {alert.currentValue !== null && alert.threshold !== null && (
                          <div className={`text-sm mb-2 ${
                            alert.severity === 'critical' && !alert.acknowledged
                              ? 'text-red-600 dark:text-red-300 font-medium'
                              : 'text-gray-500 dark:text-purple-300'
                          }`}>
                            <span>Current: <span className="font-bold">{alert.currentValue}{alert.unit}</span></span>
                            {' / '}
                            <span>Threshold: <span className="font-bold">{alert.threshold}{alert.unit}</span></span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-purple-300">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(alert.created_at || alert.timestamp), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(alert.created_at || alert.timestamp), 'HH:mm')}
                          </div>
                          {alert.location && (
                            <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              📍 {alert.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {!alert.acknowledged && alert.status === 'active' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            className={alert.severity === 'critical' 
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                              : 'bg-green-600 hover:bg-green-700'
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Acknowledge
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

