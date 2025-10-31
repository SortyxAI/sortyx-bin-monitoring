import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Battery,
  BarChart3,
  Scan,
  AlertTriangle,
  Settings,
  Wifi,
  MapPin,
  Activity,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { createPageUrl, calculateFillLevel } from "@/utils";

const SingleBinPieChart = ({ singleBin }) => {
  // Calculate fill level using the formula: Fill Level % = ((binHeight - sensorValue) / binHeight) × 100
  const fillLevel = calculateFillLevel(
    singleBin.sensorValue || singleBin.sensor_value,
    singleBin.binHeight || singleBin.bin_height
  );
  
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
    <div className="relative w-24 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={42}
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
        <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
          {fillLevel}%
        </span>
      </div>
    </div>
  );
};

export default function SingleBinDashboardCard({ singleBin, onCardClick, isExpanded: externalExpanded, onToggleExpand }) {
  // Use external state if provided, otherwise use internal state
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  
  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(singleBin.id);
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Calculate fill level using the formula: Fill Level % = ((binHeight - sensorValue) / binHeight) × 100
  const fillPercentage = calculateFillLevel(
    singleBin.sensorValue || singleBin.sensor_value,
    singleBin.binHeight || singleBin.bin_height
  );
  
  const isOverThreshold = fillPercentage >= (singleBin.fill_threshold || 90);
  const isCritical = fillPercentage >= 95;
  const isWarning = fillPercentage >= (singleBin.fill_threshold || 90) && !isCritical;

  // Extract deviceId from multiple possible field names
  const deviceId = singleBin.deviceId || singleBin.device_id || singleBin.iot_device_id || null;

  const binTypeColors = {
    recyclable: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    general_waste: 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300',
    compost: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    organic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    hazardous: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    singlebin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    mixed: 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
  };

  // Separate sensor data collection - excluding fill level
  const compartmentSensorData = [];
  
  // ✅ FIX: Battery sensor - Show as ACTIVE if battery_level has valid data
  if (singleBin.sensors_enabled?.battery_level) {
    // Check if we have valid battery data (not null, not undefined, and not 0 when it shouldn't be)
    const hasBatteryData = singleBin.battery_level !== undefined && 
                           singleBin.battery_level !== null;
    
    // Determine if sensor is online based on data availability
    const isOnline = hasBatteryData && 
                     singleBin.status === 'active' && 
                     singleBin.sensor_data_available !== false;
    
    const batteryValue = hasBatteryData ? singleBin.battery_level : 0;
    
    compartmentSensorData.push({
      type: 'battery',
      label: 'Battery',
      value: batteryValue,
      unit: '%',
      icon: Battery,
      color: batteryValue < 20 ? 'text-red-500' : batteryValue < 50 ? 'text-yellow-500' : 'text-green-500',
      bgColor: batteryValue < 20 ? 'from-red-500 to-red-600' : batteryValue < 50 ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600',
      isOffline: !isOnline
    });
  }

  if (singleBin.sensors_enabled?.temperature && singleBin.temperature !== undefined) {
    compartmentSensorData.push({
      type: 'temperature',
      label: 'Temperature',
      value: singleBin.temperature,
      unit: '°C',
      icon: Thermometer,
      color: singleBin.temperature > (singleBin.temp_threshold || 50) ? 'text-red-500' : 'text-blue-500',
      bgColor: singleBin.temperature > (singleBin.temp_threshold || 50) ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600'
    });
  }
  
  if (singleBin.sensors_enabled?.humidity && singleBin.humidity !== undefined) {
    compartmentSensorData.push({
      type: 'humidity',
      label: 'Humidity',
      value: singleBin.humidity,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-400',
      bgColor: 'from-blue-400 to-blue-500'
    });
  }
  
  if (singleBin.sensors_enabled?.air_quality && singleBin.air_quality !== undefined) {
    compartmentSensorData.push({
      type: 'air_quality',
      label: 'Air Quality',
      value: singleBin.air_quality,
      unit: ' AQI',
      icon: Wind,
      color: singleBin.air_quality > 150 ? 'text-red-500' : singleBin.air_quality > 100 ? 'text-yellow-500' : 'text-green-500',
      bgColor: singleBin.air_quality > 150 ? 'from-red-500 to-red-600' : singleBin.air_quality > 100 ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600'
    });
  }

  if (singleBin.sensors_enabled?.odour_detection && singleBin.odour_level !== undefined) {
    compartmentSensorData.push({
      type: 'odour',
      label: 'Odour Level',
      value: singleBin.odour_level,
      unit: '%',
      icon: Scan,
      color: singleBin.odour_level > 70 ? 'text-red-500' : 'text-green-500',
      bgColor: singleBin.odour_level > 70 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'
    });
  }

  // ✅ FIX: Determine if sensors are live based on data availability
  const isLiveActive = (singleBin.sensor_data_available !== false && singleBin.status === 'active') ||
                       (singleBin.last_sensor_update && 
                        (Date.now() - new Date(singleBin.last_sensor_update).getTime()) < 300000); // 5 minutes

  // Alert border and shadow styles
  const getAlertStyles = () => {
    if (isCritical) {
      return 'border-red-500 dark:border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)] dark:shadow-[0_0_40px_rgba(248,113,113,0.6)]';
    }
    if (isWarning) {
      return 'border-yellow-500 dark:border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.4)] dark:shadow-[0_0_35px_rgba(250,204,21,0.5)]';
    }
    return 'border-indigo-200 dark:border-indigo-700 shadow-lg hover:shadow-xl';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* 3D Floating Card Container */}
      <Card 
        className={`overflow-hidden transition-all duration-300 bg-gradient-to-br from-white via-white to-indigo-50/30 dark:from-[#2A1F3D] dark:via-[#241B3A] dark:to-[#1F0F2E] backdrop-blur-sm border-4 ${getAlertStyles()} transform perspective-1000`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Animated Alert Pulse Border for Critical/Warning */}
        {(isCritical || isWarning) && (
          <motion.div
            className={`absolute inset-0 rounded-lg pointer-events-none ${
              isCritical 
                ? 'bg-red-500/10 dark:bg-red-400/20' 
                : 'bg-yellow-500/10 dark:bg-yellow-400/20'
            }`}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        <CardContent className="p-0">
          {/* COLLAPSED VIEW - Header Only */}
          <div 
            className={`p-4 cursor-pointer transition-colors ${
              isExpanded ? '' : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
            }`}
            onClick={(e) => {
              if (!isExpanded) {
                e.stopPropagation();
                toggleExpand();
              }
            }}
          >
            <div className="flex items-center justify-between">
              {/* Left: Bin Name and Location */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                    {singleBin.name}
                  </h4>
                  {isOverThreshold && (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                    </motion.div>
                  )}
                </div>
                {singleBin.location && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {singleBin.location}
                  </p>
                )}
              </div>

              {/* Right: Live Indicator, Settings, Expand/Collapse */}
              <div className="flex items-center gap-2 ml-4">
                {/* Live Indicator */}
                <motion.div
                  className="relative"
                  animate={isLiveActive ? {
                    scale: [1, 1.15, 1],
                  } : {}}
                  transition={isLiveActive ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {}}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    isLiveActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    {isLiveActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-green-500"
                        animate={{
                          scale: [1, 1.8, 1],
                          opacity: [0.8, 0, 0.8]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    )}
                  </div>
                </motion.div>

                {/* Settings Button */}
                <Link to={createPageUrl("SmartBins")} onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 dark:text-purple-200 dark:hover:bg-purple-600/30"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>

                {/* Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
                  }}
                  className="h-8 w-8 dark:text-indigo-300 dark:hover:bg-indigo-600/30"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </Button>
              </div>
            </div>

            {/* Collapsed View: Quick Stats */}
            {!isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                    fillPercentage > 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                    fillPercentage > 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  }`}>
                    {fillPercentage}%
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fill Level</p>
                    <p className={`text-sm font-semibold ${
                      fillPercentage > 90 ? 'text-red-600 dark:text-red-400' :
                      fillPercentage > 70 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {fillPercentage > 90 ? 'Critical' : fillPercentage > 70 ? 'High' : 'Normal'}
                    </p>
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <Badge className={`${
                    singleBin.status === 'active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
                  } text-xs mt-0.5`}>
                    {singleBin.status === 'active' ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
              </motion.div>
            )}
          </div>

          {/* EXPANDED VIEW - Full Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  {/* Layer 2: Compartment Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Compartment
                      </span>
                      {singleBin.compartment_name && (
                        <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0 font-mono">
                          {singleBin.compartment_name}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Height and Bin Type Display */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {(singleBin.binHeight || singleBin.bin_height) && (
                        <div className="bg-white/70 dark:bg-indigo-900/40 rounded px-2 py-1.5 border border-blue-300 dark:border-blue-600">
                          <div className="flex items-center gap-1 mb-0.5">
                            <BarChart3 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Height</span>
                          </div>
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{singleBin.binHeight || singleBin.bin_height} cm</span>
                        </div>
                      )}
                      <div className="bg-white/70 dark:bg-indigo-900/40 rounded px-2 py-1.5 border border-blue-300 dark:border-blue-600">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Bin Type</span>
                        </div>
                        <Badge className={`${binTypeColors[singleBin.bin_type || singleBin.type]} text-[10px] px-1.5`}>
                          {(singleBin.bin_type || singleBin.type || 'mixed').replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Device ID Display */}
                    {deviceId && (
                      <div className="bg-white/70 dark:bg-indigo-900/40 rounded px-2 py-1.5 border border-blue-300 dark:border-blue-600 mb-2">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Wifi className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Device ID</span>
                        </div>
                        <span className="font-mono text-xs text-blue-700 dark:text-blue-300 block break-all">{deviceId}</span>
                      </div>
                    )}
                    
                    {/* Status and Description */}
                    <div className="flex items-center justify-between">
                      <Badge className={`${
                        singleBin.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
                      } text-[10px]`}>
                        {singleBin.status === 'active' ? '● Active' : '○ Suspended'}
                      </Badge>
                      {singleBin.description && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[180px]">
                          {singleBin.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Layer 3: Fill Level Section */}
                  <div className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fill Level Status</span>
                      <motion.div
                        className="flex items-center gap-1"
                        animate={isLiveActive ? {
                          scale: [1, 1.1, 1],
                          opacity: [1, 0.7, 1]
                        } : {}}
                        transition={isLiveActive ? {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        } : {}}
                      >
                        <Wifi className={`w-3 h-3 ${isLiveActive ? 'text-green-500' : 'text-gray-400'}`} />
                        <Badge 
                          className={`text-[9px] px-1.5 py-0.5 ${
                            isLiveActive 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {isLiveActive ? 'LIVE' : 'OFFLINE'}
                        </Badge>
                      </motion.div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <SingleBinPieChart singleBin={singleBin} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Fill Level</span>
                          <span className={`font-bold ${
                            fillPercentage > 90 ? 'text-red-600 dark:text-red-400' :
                            fillPercentage > 70 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {fillPercentage}%
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-indigo-900/60 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            className={`h-full rounded-full ${
                              fillPercentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                              fillPercentage > 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                              'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${fillPercentage}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-white/60 dark:bg-indigo-900/40 rounded-lg px-3 py-2 border border-indigo-200 dark:border-indigo-700">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Capacity:</span>
                          <span className="ml-1 font-semibold text-gray-700 dark:text-gray-200">{singleBin.capacity || 100}L</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Alert Threshold:</span>
                          <span className="ml-1 font-semibold text-orange-600 dark:text-orange-400">{singleBin.fill_threshold || 80}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layer 4: Compartment Sensor Section */}
                  {compartmentSensorData.length > 0 && (
                    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4 border-2 border-emerald-200 dark:border-emerald-700/50 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                            <Activity className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              Compartment Sensors
                            </h5>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Real-time sensor monitoring</p>
                          </div>
                        </div>
                      </div>

                      <div className={`grid ${compartmentSensorData.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                        {compartmentSensorData.map((sensor, index) => (
                          <motion.div
                            key={sensor.type}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/90 dark:bg-emerald-800/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-600/40 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${sensor.bgColor.replace('from-', 'from-').replace('to-', 'to-')}/10 flex items-center justify-center`}>
                                  <sensor.icon className={`w-4 h-4 ${sensor.color}`} />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                  {sensor.label}
                                </span>
                              </div>
                              {sensor.type === 'battery' && sensor.isOffline && (
                                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-[9px] px-1.5 py-0">
                                  Offline
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-baseline justify-between">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                  {sensor.value}{sensor.unit}
                                </span>
                                {(sensor.type === 'battery' || sensor.type === 'humidity' || sensor.type === 'odour') && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {sensor.value < 20 ? 'Critical' : sensor.value < 50 ? 'Low' : 'Good'}
                                  </span>
                                )}
                              </div>
                              
                              {(sensor.type === 'battery' || sensor.type === 'humidity' || sensor.type === 'odour') && (
                                <div className="h-2 bg-gray-200 dark:bg-emerald-900/60 rounded-full overflow-hidden shadow-inner">
                                  <motion.div
                                    className={`h-full rounded-full bg-gradient-to-r ${sensor.bgColor}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${sensor.value}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                  />
                                </div>
                              )}
                              
                              {sensor.type === 'battery' && sensor.value < 20 && (
                                <motion.p 
                                  className="text-[10px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  Requires attention
                                </motion.p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {singleBin.last_sensor_update && (
                        <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700/40">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                            Last updated: {new Date(singleBin.last_sensor_update).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}