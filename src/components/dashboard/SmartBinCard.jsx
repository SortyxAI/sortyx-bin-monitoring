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
import { createPageUrl, calculateFillLevel } from "@/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Reusable Pie Chart Component for Compartments (Smaller for Multi-Compartment)
const CompartmentPieChart = ({ compartment, size = "small" }) => {
  const fillLevel = calculateFillLevel(
    compartment.sensorValue || compartment.sensor_value,
    compartment.binHeight || compartment.bin_height
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

  const dimensions = size === "small" ? { w: 16, h: 16, inner: 20, outer: 28 } : { w: 24, h: 24, inner: 30, outer: 42 };

  return (
    <div className={`relative ${size === "small" ? "w-16 h-16" : "w-24 h-24"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={dimensions.inner}
            outerRadius={dimensions.outer}
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
        <span className={`${size === "small" ? "text-xs" : "text-lg"} font-bold text-gray-700 dark:text-gray-200`}>
          {fillLevel}%
        </span>
      </div>
    </div>
  );
};

// Individual Compartment Card matching SingleBinDashboardCard design
const IndividualCompartmentCard = ({ compartment, index }) => {
  const fillPercentage = calculateFillLevel(
    compartment.sensorValue || compartment.sensor_value,
    compartment.binHeight || compartment.bin_height
  );
  
  const isOverThreshold = fillPercentage >= (compartment.fill_threshold || 90);
  const deviceId = compartment.deviceId || compartment.device_id || compartment.iot_device_id || null;

  const binTypeColors = {
    recyclable: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    general_waste: 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300',
    compost: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    organic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    hazardous: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    singlebin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    mixed: 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
  };

  // Collect compartment sensor data - excluding fill level
  const compartmentSensorData = [];
  
  // ✅ FIX: Battery sensor - Show as ACTIVE if battery_level has valid data
  if (compartment.sensors_enabled?.battery_level) {
    // Check if we have valid battery data (not null, not undefined)
    const hasBatteryData = compartment.battery_level !== undefined && 
                           compartment.battery_level !== null;
    
    // Determine if sensor is online based on data availability
    const isOnline = hasBatteryData && 
                     compartment.status === 'active' && 
                     compartment.sensor_data_available !== false;
    
    const batteryValue = hasBatteryData ? compartment.battery_level : 0;
    
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

  if (compartment.sensors_enabled?.temperature && compartment.temperature !== undefined) {
    compartmentSensorData.push({
      type: 'temperature',
      label: 'Temperature',
      value: compartment.temperature,
      unit: '°C',
      icon: Thermometer,
      color: compartment.temperature > (compartment.temp_threshold || 50) ? 'text-red-500' : 'text-blue-500',
      bgColor: compartment.temperature > (compartment.temp_threshold || 50) ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600'
    });
  }
  
  if (compartment.sensors_enabled?.humidity && compartment.humidity !== undefined) {
    compartmentSensorData.push({
      type: 'humidity',
      label: 'Humidity',
      value: compartment.humidity,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-400',
      bgColor: 'from-blue-400 to-blue-500'
    });
  }
  
  if (compartment.sensors_enabled?.air_quality && compartment.air_quality !== undefined) {
    compartmentSensorData.push({
      type: 'air_quality',
      label: 'Air Quality',
      value: compartment.air_quality,
      unit: ' AQI',
      icon: Wind,
      color: compartment.air_quality > 150 ? 'text-red-500' : compartment.air_quality > 100 ? 'text-yellow-500' : 'text-green-500',
      bgColor: compartment.air_quality > 150 ? 'from-red-500 to-red-600' : compartment.air_quality > 100 ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600'
    });
  }

  if (compartment.sensors_enabled?.odour_detection && compartment.odour_level !== undefined) {
    compartmentSensorData.push({
      type: 'odour',
      label: 'Odour Level',
      value: compartment.odour_level,
      unit: '%',
      icon: Scan,
      color: compartment.odour_level > 70 ? 'text-red-500' : 'text-green-500',
      bgColor: compartment.odour_level > 70 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'
    });
  }

  if (compartment.sensors_enabled?.weight && compartment.weight !== undefined) {
    compartmentSensorData.push({
      type: 'weight',
      label: 'Weight',
      value: compartment.weight,
      unit: 'kg',
      icon: Weight,
      color: 'text-purple-500',
      bgColor: 'from-purple-500 to-purple-600'
    });
  }

  if (compartment.sensors_enabled?.lid_sensor && compartment.lid_open !== undefined) {
    compartmentSensorData.push({
      type: 'lid_status',
      label: 'Lid Status',
      value: compartment.lid_open ? 'Open' : 'Closed',
      unit: '',
      icon: DoorOpen,
      color: compartment.lid_open ? 'text-orange-500' : 'text-green-500',
      bgColor: compartment.lid_open ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'
    });
  }

  // ✅ FIX: Determine if sensors are live based on data availability
  const isLiveActive = (compartment.sensor_data_available !== false && compartment.status === 'active') ||
                       (compartment.last_sensor_update && 
                        (Date.now() - new Date(compartment.last_sensor_update).getTime()) < 300000); // 5 minutes

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        className={`overflow-hidden transition-all duration-300 bg-gradient-to-br from-white via-white to-indigo-50/30 dark:from-[#2A1F3D] dark:via-[#241B3A] dark:to-[#1F0F2E] backdrop-blur-sm border-2 shadow-lg hover:shadow-xl hover:scale-[1.02] ${
          isOverThreshold 
            ? 'border-red-500 dark:border-red-400 shadow-red-500/20 dark:shadow-red-400/30' 
            : 'border-indigo-200 dark:border-indigo-700'
        }`}
      >
        <CardContent className="p-4">
          {/* Layer 1: Compartment Header */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-base text-gray-900 dark:text-white">
                {compartment.label || compartment.name}
              </h4>
              {isOverThreshold && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Layer 2: Compartment Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2.5 mb-2.5 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Compartment Info
              </span>
              {compartment.compartment_name && (
                <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0 font-mono">
                  {compartment.compartment_name}
                </Badge>
              )}
            </div>
            
            {/* Height and Bin Type */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {(compartment.binHeight || compartment.bin_height) && (
                <div className="bg-white/70 dark:bg-indigo-900/40 rounded px-1.5 py-1 border border-blue-300 dark:border-blue-600">
                  <div className="flex items-center gap-1 mb-0.5">
                    <BarChart3 className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[9px] font-medium text-gray-600 dark:text-gray-300">Height</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">{compartment.binHeight || compartment.bin_height} cm</span>
                </div>
              )}
              <div className="bg-white/70 dark:bg-indigo-900/40 rounded px-1.5 py-1 border border-blue-300 dark:border-blue-600">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] font-medium text-gray-600 dark:text-gray-300">Type</span>
                </div>
                <Badge className={`${binTypeColors[compartment.bin_type || compartment.type || 'mixed']} text-[9px] px-1`}>
                  {(compartment.bin_type || compartment.type || 'mixed').replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            {/* Device ID */}
            {deviceId && (
              <div className="bg-white/70 dark:bg-indigo-900/40 rounded px-1.5 py-1 border border-blue-300 dark:border-blue-600 mb-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <Wifi className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-[9px] font-medium text-gray-600 dark:text-gray-300">Device ID</span>
                </div>
                <span className="font-mono text-[10px] text-blue-700 dark:text-blue-300 block break-all">{deviceId}</span>
              </div>
            )}
            
            {/* Status Badge */}
            <Badge className={`${
              compartment.status === 'active' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
            } text-[9px]`}>
              {compartment.status === 'active' ? '● Active' : '○ Suspended'}
            </Badge>
          </div>

          {/* Layer 3: Fill Level Section */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-lg p-3 mb-3 border border-indigo-200 dark:border-indigo-700">
            {/* ✅ NEW: LIVE Badge at top of Fill Level section */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fill Level Status</span>
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
                <Wifi className={`w-2.5 h-2.5 ${isLiveActive ? 'text-green-500' : 'text-gray-400'}`} />
                <Badge 
                  className={`text-[8px] px-1 py-0 ${
                    isLiveActive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {isLiveActive ? 'LIVE' : 'OFFLINE'}
                </Badge>
              </motion.div>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <CompartmentPieChart compartment={compartment} size="small" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">Fill Level</span>
                  <span className={`font-bold ${
                    fillPercentage > 90 ? 'text-red-600 dark:text-red-400' :
                    fillPercentage > 70 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {fillPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-indigo-900/60 rounded-full overflow-hidden shadow-inner">
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
            {/* Capacity and Alert Threshold */}
            <div className="flex items-center justify-between text-[10px] bg-white/60 dark:bg-indigo-900/40 rounded-lg px-2 py-1.5 border border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center gap-2">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Capacity:</span>
                  <span className="ml-1 font-semibold text-gray-700 dark:text-gray-200">{compartment.capacity || 100}L</span>
                </div>
                <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Alert:</span>
                  <span className="ml-1 font-semibold text-orange-600 dark:text-orange-400">{compartment.fill_threshold || 80}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 4: Compartment Sensor Section */}
          {compartmentSensorData.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 rounded-lg p-3 border-2 border-emerald-200 dark:border-emerald-700/50 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md flex items-center justify-center shadow-md">
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Sensors
                    </h5>
                  </div>
                </div>
                {/* ✅ REMOVED: LIVE badge from here - now in Fill Level section */}
              </div>

              {/* Sensor Grid */}
              <div className={`grid ${compartmentSensorData.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                {compartmentSensorData.map((sensor, sensorIndex) => (
                  <motion.div
                    key={sensor.type}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sensorIndex * 0.05 }}
                    className="bg-white/90 dark:bg-emerald-800/30 rounded-md p-2 border border-emerald-200 dark:border-emerald-600/40 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <div className={`w-5 h-5 rounded-sm bg-gradient-to-br ${sensor.bgColor}/10 flex items-center justify-center`}>
                          <sensor.icon className={`w-2.5 h-2.5 ${sensor.color}`} />
                        </div>
                        <span className="text-[9px] font-medium text-gray-700 dark:text-gray-200">
                          {sensor.label}
                        </span>
                      </div>
                      {sensor.type === 'battery' && sensor.isOffline && (
                        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-[8px] px-1 py-0">
                          Offline
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {sensor.value}{sensor.unit}
                        </span>
                      </div>
                      
                      {/* Progress bar for percentage-based sensors */}
                      {(sensor.type === 'battery' || sensor.type === 'humidity' || sensor.type === 'odour') && (
                        <div className="h-1.5 bg-gray-200 dark:bg-emerald-900/60 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${sensor.bgColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${sensor.value}%` }}
                            transition={{ duration: 0.8, delay: sensorIndex * 0.05 }}
                          />
                        </div>
                      )}
                      
                      {sensor.type === 'battery' && sensor.value < 20 && (
                        <motion.p 
                          className="text-[9px] text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-0.5"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <AlertTriangle className="w-2 h-2" />
                          Low
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Timestamp */}
              {compartment.last_sensor_update && (
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-700/40">
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 text-center">
                    Updated: {new Date(compartment.last_sensor_update).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ✅ UPDATED: SmartBinCommonSensors - Shows only SmartBin-level common sensors (not aggregated from compartments)
const SmartBinCommonSensors = ({ smartBin }) => {
  // Only show sensors that are enabled at the SmartBin level (common to all compartments)
  const commonSensorData = [];
  
  // Temperature - only if enabled at SmartBin level
  if (smartBin.sensors_enabled?.temperature && smartBin.temperature !== undefined && smartBin.temperature !== null) {
    const tempThreshold = smartBin.temp_threshold || 50;
    commonSensorData.push({
      type: 'temperature',
      label: 'Temperature',
      value: smartBin.temperature,
      unit: '°C',
      icon: Thermometer,
      color: smartBin.temperature > tempThreshold ? 'text-red-500' : 'text-blue-500',
      bgColor: smartBin.temperature > tempThreshold ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600'
    });
  }
  
  // Humidity - only if enabled at SmartBin level
  if (smartBin.sensors_enabled?.humidity && smartBin.humidity !== undefined && smartBin.humidity !== null) {
    commonSensorData.push({
      type: 'humidity',
      label: 'Humidity',
      value: smartBin.humidity,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-400',
      bgColor: 'from-blue-400 to-blue-500'
    });
  }
  
  // Air Quality - only if enabled at SmartBin level
  if (smartBin.sensors_enabled?.air_quality && smartBin.air_quality !== undefined && smartBin.air_quality !== null) {
    commonSensorData.push({
      type: 'air_quality',
      label: 'Air Quality',
      value: smartBin.air_quality,
      unit: ' AQI',
      icon: Wind,
      color: smartBin.air_quality > 150 ? 'text-red-500' : smartBin.air_quality > 100 ? 'text-yellow-500' : 'text-green-500',
      bgColor: smartBin.air_quality > 150 ? 'from-red-500 to-red-600' : smartBin.air_quality > 100 ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600'
    });
  }

  // Battery - only if enabled at SmartBin level
  if (smartBin.sensors_enabled?.battery_level && smartBin.battery_level !== undefined && smartBin.battery_level !== null) {
    commonSensorData.push({
      type: 'battery_level',
      label: 'Battery',
      value: smartBin.battery_level,
      unit: '%',
      icon: Battery,
      color: smartBin.battery_level < 20 ? 'text-red-500' : smartBin.battery_level < 50 ? 'text-yellow-500' : 'text-green-500',
      bgColor: smartBin.battery_level < 20 ? 'from-red-500 to-red-600' : smartBin.battery_level < 50 ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600'
    });
  }

  // Weight - only if enabled at SmartBin level
  if (smartBin.sensors_enabled?.weight && smartBin.weight !== undefined && smartBin.weight !== null) {
    commonSensorData.push({
      type: 'weight',
      label: 'Weight',
      value: smartBin.weight,
      unit: ' kg',
      icon: Weight,
      color: 'text-purple-500',
      bgColor: 'from-purple-500 to-purple-600'
    });
  }

  // If no common sensors are enabled at SmartBin level, don't show this section
  if (commonSensorData.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border-2 border-indigo-200 dark:border-indigo-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 border-b border-indigo-300 dark:border-indigo-700 pb-2 flex-1">
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
          <span>Common Sensors</span>
          <Badge className="ml-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200 text-[10px] px-2 py-0">
            Bin Level
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {commonSensorData.map((sensor, index) => (
          <motion.div
            key={sensor.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/90 dark:bg-gradient-to-br dark:from-indigo-800/50 dark:to-purple-800/50 rounded-lg p-3 border border-indigo-200 dark:border-indigo-600/40 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${sensor.bgColor}/10 flex items-center justify-center`}>
                <sensor.icon className={`w-4 h-4 ${sensor.color}`} />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 uppercase font-medium tracking-wide">
                {sensor.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {sensor.value}{sensor.unit}
              </div>
            </div>
            {/* Progress bar for percentage-based sensors */}
            {(sensor.type === 'battery_level' || sensor.type === 'humidity') && (
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-indigo-900/60 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${sensor.bgColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${sensor.value}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
            )}
            {/* Warning for low battery */}
            {sensor.type === 'battery_level' && sensor.value < 20 && (
              <motion.p 
                className="text-[10px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <AlertTriangle className="w-3 h-3" />
                Critical
              </motion.p>
            )}
          </motion.div>
        ))}
      </div>
      
      {smartBin.last_sensor_update && (
        <div className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1 mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
          <Activity className="w-3 h-3" />
          Last updated: {new Date(smartBin.last_sensor_update).toLocaleString()}
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

  // ✅ FIX: Calculate actual fill percentage for each compartment instead of using raw current_fill
  const hasOverThreshold = compartments.some(comp => {
    const fillPercentage = calculateFillLevel(
      comp.sensorValue || comp.sensor_value,
      comp.binHeight || comp.bin_height
    );
    return fillPercentage >= (comp.fill_threshold || 90);
  });

  // ✅ FIX: Check battery levels too - if any compartment has low battery, it needs attention
  const hasLowBattery = compartments.some(comp => {
    const batteryLevel = comp.battery_level;
    return batteryLevel !== undefined && batteryLevel !== null && batteryLevel < 20;
  });

  // ✅ FIX: Overall status logic - critical only if fill level is high OR battery is critically low
  const overallStatus = (hasOverThreshold || hasLowBattery) ? 'critical' : 
                        hasCompartments ? 'normal' : 
                        'maintenance';
  
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

                {/* ✅ UPDATED: Pass smartBin to SmartBinCommonSensors */}
                <SmartBinCommonSensors smartBin={smartBin} />

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
                        <IndividualCompartmentCard 
                          key={compartment.id} 
                          compartment={compartment} 
                          index={index}
                        />
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
