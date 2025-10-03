
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Weight,
  AlertTriangle,
  Settings,
  Activity,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Zap,
  Gauge,
  Battery,
  Wifi,
  BarChart3,
  Scan,
  DoorOpen
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CompartmentPieChart = ({ compartment }) => {
  const fillLevel = compartment.current_fill || 0;
  const data = [
    { 
      name: 'Filled', 
      value: fillLevel, 
      color: fillLevel > 90 ? '#ef4444' : fillLevel > 70 ? '#f59e0b' : '#10b981' 
    },
    { 
      name: 'Empty', 
      value: 100 - fillLevel, 
      color: '#e5e7eb' 
    }
  ];

  return (
    <div className="relative w-20 h-20">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={25}
            outerRadius={35}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
          {fillLevel}%
        </span>
      </div>
    </div>
  );
};

const IndividualCompartmentSensors = ({ compartment }) => {
  const sensorData = [];
  
  if (compartment.sensors_enabled?.fill_level && compartment.current_fill !== undefined) {
    sensorData.push({
      type: 'fill_level',
      value: compartment.current_fill,
      unit: '%',
      icon: BarChart3,
      color: compartment.current_fill > 90 ? 'text-red-500' : compartment.current_fill > 70 ? 'text-yellow-500' : 'text-green-500'
    });
  }
  
  if (compartment.sensors_enabled?.weight && compartment.weight !== undefined) {
    sensorData.push({
      type: 'weight',
      value: compartment.weight,
      unit: 'kg',
      icon: Weight,
      color: 'text-purple-500'
    });
  }
  
  if (compartment.sensors_enabled?.odour_detection && compartment.odour_level !== undefined) {
    sensorData.push({
      type: 'odour',
      value: compartment.odour_level,
      unit: '',
      icon: Scan,
      color: compartment.odour_level > 70 ? 'text-red-500' : 'text-green-500'
    });
  }
  
  if (compartment.sensors_enabled?.lid_sensor && compartment.lid_open !== undefined) {
    sensorData.push({
      type: 'lid_status',
      value: compartment.lid_open ? 'Open' : 'Closed',
      unit: '',
      icon: DoorOpen,
      color: compartment.lid_open ? 'text-orange-500' : 'text-green-500'
    });
  }

  if (sensorData.length === 0) {
    return (
      <div className="mt-3 text-center py-2 text-gray-400 dark:text-gray-500 bg-amber-50/50 dark:bg-amber-900/10 rounded text-xs border border-amber-200/50 dark:border-amber-700/30">
        <Zap className="w-3 h-3 mx-auto mb-1 opacity-50" />
        <p>No sensors enabled</p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-amber-100/60 to-orange-100/60 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-300/50 dark:border-amber-700/40 shadow-inner">
      <div className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 border-b border-amber-400/50 dark:border-amber-600/50 pb-2 mb-2">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 15, -15, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Wifi className="w-3 h-3" />
        </motion.div>
        <span>Compartment Sensors</span>
        <motion.div
          className="w-1 h-1 bg-amber-600 dark:bg-amber-400 rounded-full ml-1"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sensorData.map((sensor, index) => (
          <motion.div
            key={sensor.type}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/80 dark:bg-gradient-to-br dark:from-amber-800/40 dark:to-orange-800/40 rounded-md p-2 border border-amber-200 dark:border-amber-600/30 shadow-sm"
          >
            <div className="flex items-center gap-1 mb-1">
              <sensor.icon className={`w-3 h-3 ${sensor.color}`} />
              <span className="text-xs text-gray-600 dark:text-gray-200 uppercase tracking-wide">
                {sensor.type.replace('_', ' ')}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {sensor.value}{sensor.unit}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SmartBinLevelSensors = ({ smartBin }) => {
  const sensorData = [];
  
  if (smartBin.sensors_enabled?.temperature && smartBin.temperature !== undefined) {
    sensorData.push({
      type: 'temperature',
      value: smartBin.temperature,
      unit: '°C',
      icon: Thermometer,
      color: smartBin.temperature > (smartBin.temp_threshold || 50) ? 'text-red-500' : 'text-blue-500'
    });
  }
  
  if (smartBin.sensors_enabled?.humidity && smartBin.humidity !== undefined) {
    sensorData.push({
      type: 'humidity',
      value: smartBin.humidity,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-400'
    });
  }
  
  if (smartBin.sensors_enabled?.air_quality && smartBin.air_quality !== undefined) {
    sensorData.push({
      type: 'air_quality',
      value: smartBin.air_quality,
      unit: 'AQI',
      icon: Wind,
      color: smartBin.air_quality > 150 ? 'text-red-500' : smartBin.air_quality > 100 ? 'text-yellow-500' : 'text-green-500'
    });
  }

  if (smartBin.sensors_enabled?.battery_level && smartBin.battery_level !== undefined) {
    sensorData.push({
      type: 'battery_level',
      value: smartBin.battery_level,
      unit: '%',
      icon: Battery,
      color: smartBin.battery_level < 20 ? 'text-red-500' : smartBin.battery_level < 50 ? 'text-yellow-500' : 'text-green-500'
    });
  }

  if (sensorData.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border-2 border-indigo-200 dark:border-indigo-700/50">
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-3 border-b border-indigo-300 dark:border-indigo-700 pb-2">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 15, -15, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Wifi className="w-4 h-4" />
        </motion.div>
        <span>SmartBin Common Sensors</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sensorData.map((sensor, index) => (
          <motion.div
            key={sensor.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/90 dark:bg-gradient-to-br dark:from-indigo-800/50 dark:to-purple-800/50 rounded-lg p-3 border border-indigo-200 dark:border-indigo-600/40 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <sensor.icon className={`w-4 h-4 ${sensor.color}`} />
              <span className="text-xs text-gray-600 dark:text-gray-300 uppercase font-medium tracking-wide">
                {sensor.type.replace('_', ' ')}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {sensor.value}{sensor.unit}
            </div>
          </motion.div>
        ))}
      </div>
      {smartBin.last_sensor_update && (
        <div className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1 mt-3">
          <Activity className="w-3 h-3" />
          Updated: {new Date(smartBin.last_sensor_update).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default function SmartBinCard({ smartBin, compartments = [], alerts = [], isDragging = false, onCardClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const smartBinAlerts = alerts.filter(alert => 
    compartments.some(comp => comp.id === alert.compartment_id)
  );
  
  const hasAlerts = smartBinAlerts.length > 0;
  const criticalAlerts = smartBinAlerts.filter(alert => alert.severity === 'critical').length;
  const hasCompartments = compartments.length > 0;

  const hasOverThreshold = compartments.some(comp => 
    (comp.current_fill || 0) >= (comp.fill_threshold || 90)
  );

  const overallStatus = hasOverThreshold ? 'critical' : hasCompartments ? 'normal' : 'maintenance';
  
  const statusColor = overallStatus === 'critical' ? 
    'border-red-500 dark:border-red-400 shadow-red-500/20 dark:shadow-red-400/30' : 
    overallStatus === 'maintenance' ?
    'border-orange-500 dark:border-orange-400 shadow-orange-500/20 dark:shadow-orange-400/30' :
    'border-green-500 dark:border-green-400 shadow-green-500/20 dark:shadow-green-400/30';

  const statusBadgeColor = overallStatus === 'critical' ?
    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200' :
    overallStatus === 'maintenance' ?
    'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200' :
    'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200';

  const binStatusColor = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
    inactive: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
    maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200'
  }[smartBin.status];

  const getDotColor = () => {
    if (criticalAlerts > 0) return '#ef4444';
    if (!hasCompartments || smartBin.status === 'maintenance') return '#f97316';
    if (smartBin.status === 'inactive') return '#ef4444';
    return '#10b981';
  };

  const shouldFlash = criticalAlerts > 0 || (hasCompartments && smartBin.status === 'active') || smartBin.status === 'inactive';

  return (
    <motion.div
      layout
      whileHover={!isDragging ? { scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`overflow-hidden transition-all duration-300 bg-gradient-to-br from-white via-white to-purple-50/30 dark:from-[#2A1F3D] dark:via-[#241B3A] dark:to-[#1F0F2E] backdrop-blur-sm border-2 ${statusColor} shadow-xl ${isDragging ? 'shadow-2xl cursor-grabbing' : 'cursor-grab'}`}
        onDoubleClick={() => onCardClick && onCardClick(smartBin, 'smartbin')}
      >
        <CardHeader 
          className="pb-3 bg-gradient-to-r from-white/60 to-purple-50/60 dark:from-purple-900/40 dark:via-purple-800/50 dark:to-purple-900/60 cursor-pointer relative"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-purple-300 hover:text-gray-600 dark:hover:text-purple-200">
            <GripVertical className="w-4 h-4" />
          </div>
          
          <div className="flex justify-between items-center pl-6">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-purple-100">
                  {smartBin.name}
                  {hasAlerts && criticalAlerts > 0 && (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </motion.div>
                  )}
                </CardTitle>
                <div className="flex items-center gap-3 mt-2">
                  {smartBin.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-purple-200">
                      <MapPin className="w-4 h-4" />
                      {smartBin.location}
                    </div>
                  )}
                  <Badge className={binStatusColor}>
                    {smartBin.status}
                  </Badge>
                  <Badge className={statusBadgeColor}>
                    <motion.div
                      animate={overallStatus === 'critical' ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {overallStatus === 'critical' ? 'Action Required' : 
                       overallStatus === 'maintenance' ? 'Setup Needed' : 'All Good'}
                    </motion.div>
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 rounded-full relative"
                style={{ backgroundColor: getDotColor() }}
                animate={shouldFlash ? { 
                  opacity: [1, 0.4, 1],
                  scale: [1, 1.2, 1]
                } : {}}
                transition={{ 
                  duration: criticalAlerts > 0 ? 0.8 : smartBin.status === 'inactive' ? 0.6 : 1.5, 
                  repeat: shouldFlash ? Infinity : 0 
                }}
              >
                {smartBin.status === 'active' && hasCompartments && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-green-400"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              <Link to={createPageUrl("SmartBins")} onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="dark:text-purple-200 dark:hover:bg-purple-600/30">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="dark:text-purple-200 dark:hover:bg-purple-600/30">
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </motion.div>
              </Button>
            </div>
          </div>

          {!isExpanded && (
            <motion.div 
              className="mt-4 pl-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-purple-200">
                  {compartments.length} compartments • {compartments.filter(c => (c.current_fill || 0) > 80).length} need attention
                </div>
                <div className="flex items-center gap-2">
                  {hasAlerts && (
                    <Badge variant="destructive" className="animate-pulse dark:bg-red-900/70 dark:text-red-200">
                      {criticalAlerts} Critical
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <CardContent className="bg-gradient-to-br from-white/80 to-purple-50/40 dark:from-[#1F0F2E]/80 dark:to-[#2A1F3D]/60 pt-6 space-y-6">
                {smartBin.description && (
                  <p className="text-sm text-gray-600 dark:text-purple-200">{smartBin.description}</p>
                )}

                {hasAlerts && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="dark:bg-red-900/70 dark:text-red-200">
                      {criticalAlerts} Critical
                    </Badge>
                    <Badge variant="secondary" className="dark:bg-purple-700/60 dark:text-purple-100">
                      {smartBinAlerts.length - criticalAlerts} Warnings
                    </Badge>
                  </div>
                )}

                <SmartBinLevelSensors smartBin={smartBin} />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent border-b border-emerald-200 dark:border-emerald-700 pb-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Individual Compartments ({compartments.length})
                  </div>
                  
                  {compartments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-purple-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg border-2 border-dashed border-orange-200 dark:border-orange-700">
                      <p>No compartments configured</p>
                      <Link to={createPageUrl("SmartBins")}>
                        <Button variant="outline" size="sm" className="mt-2 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:bg-orange-800/50 dark:text-orange-300 dark:hover:bg-orange-700">
                          Add Compartments
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {compartments.map((compartment, index) => (
                        <motion.div
                          key={compartment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-purple-900/50 dark:to-purple-800/70 rounded-xl p-4 border-2 border-indigo-200 dark:border-purple-600/50 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-900 dark:text-purple-100 text-base">
                              {compartment.label}
                            </h5>
                            <Badge variant="outline" className="text-xs dark:border-purple-400 dark:text-purple-200 bg-purple-50 dark:bg-purple-800/60">
                              {compartment.bin_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-4">
                            <CompartmentPieChart compartment={compartment} />
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-purple-200 font-medium">Fill Level</span>
                                <span className={`font-bold ${
                                  (compartment.current_fill || 0) > 90 ? 'text-red-600 dark:text-red-400' :
                                  (compartment.current_fill || 0) > 70 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {compartment.current_fill || 0}%
                                </span>
                              </div>
                              <div className="h-3 bg-gray-200 dark:bg-purple-900/60 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                  className={`h-full rounded-full ${
                                    (compartment.current_fill || 0) > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    (compartment.current_fill || 0) > 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                    'bg-gradient-to-r from-green-500 to-green-600'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${compartment.current_fill || 0}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 dark:text-purple-200 bg-gray-50/50 dark:bg-purple-900/40 rounded-lg p-2 mb-3">
                            <div className="flex justify-between">
                              <span>Capacity: {compartment.capacity}L</span>
                              <span>Alert: {compartment.fill_threshold}%</span>
                            </div>
                          </div>

                          <IndividualCompartmentSensors compartment={compartment} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
