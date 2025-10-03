
import React, { useState, useEffect } from "react";
import { Alert as AlertEntity } from "@/api/entities";
import { Compartment } from "@/api/entities";
import { SmartBin } from "@/api/entities";
import { User } from "@/api/entities";
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
  Clock
} from "lucide-react";
import { format } from "date-fns";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [compartments, setCompartments] = useState([]);
  const [smartBins, setSmartBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      
      // Check if admin is impersonating another user
      const impersonatedUserStr = localStorage.getItem('impersonatedUser');
      const effectiveUser = impersonatedUserStr ? JSON.parse(impersonatedUserStr) : currentUser;
      
      const [alertData, compartmentData, smartBinData] = await Promise.all([
        AlertEntity.list('-created_date'),
        Compartment.list(),
        SmartBin.filter({ created_by: effectiveUser.email })
      ]);

      setAlerts(alertData);
      setCompartments(compartmentData);
      setSmartBins(smartBinData);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await AlertEntity.update(alertId, { acknowledged: true });
      loadData();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await AlertEntity.update(alertId, { resolved: true });
      loadData();
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  // Get compartment and smartbin info for each alert
  const enrichedAlerts = alerts.map(alert => {
    const compartment = compartments.find(c => c.id === alert.compartment_id);
    const smartBin = compartment ? smartBins.find(sb => sb.id === compartment.smartbin_id) : null;
    return { ...alert, compartment, smartBin };
  }).filter(alert => alert.smartBin); // Only show alerts from user's bins

  // Filter alerts
  const filteredAlerts = enrichedAlerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.severity === filter ||
                         (filter === 'unresolved' && !alert.resolved) ||
                         (filter === 'resolved' && alert.resolved);
    
    const matchesSearch = !searchTerm || 
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.smartBin?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.compartment?.label.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <Bell className="w-5 h-5 text-yellow-600" />;
      default: return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
          <p className="text-gray-600">Loading alerts...</p>
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
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alert Management</h1>
        <p className="text-gray-600">Monitor and manage system alerts and notifications</p>
      </motion.div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {enrichedAlerts.filter(a => a.severity === 'critical' && !a.resolved).length}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {enrichedAlerts.filter(a => a.severity === 'warning' && !a.resolved).length}
            </div>
            <div className="text-sm text-gray-600">Warnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {enrichedAlerts.filter(a => !a.resolved).length}
            </div>
            <div className="text-sm text-gray-600">Unresolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {enrichedAlerts.filter(a => a.resolved).length}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No matching alerts' : 'No alerts found'}
            </h3>
            <p className="text-gray-500 text-center">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'All systems are running normally'
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
                  alert.severity === 'critical' && !alert.resolved ? 'ring-2 ring-red-200 animate-pulse' : ''
                } ${alert.resolved ? 'opacity-75' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getSeverityColor(alert.severity)} border`}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">
                            {alert.alert_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {alert.resolved && (
                            <Badge className="bg-green-100 text-green-700">
                              Resolved
                            </Badge>
                          )}
                          {alert.acknowledged && !alert.resolved && (
                            <Badge variant="secondary">
                              Acknowledged
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-1">
                          {alert.smartBin?.name} - {alert.compartment?.label}
                        </h3>
                        
                        <p className="text-gray-700 mb-2">{alert.message}</p>
                        
                        {alert.value && (
                          <p className="text-sm text-gray-500 mb-2">
                            Current Value: <span className="font-medium">{alert.value}</span> 
                            {alert.threshold && (
                              <> / Threshold: <span className="font-medium">{alert.threshold}</span></>
                            )}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(alert.created_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(alert.created_date), 'HH:mm')}
                          </div>
                        </div>
                      </div>

                      {!alert.resolved && (
                        <div className="flex gap-2">
                          {!alert.acknowledged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Resolve
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
