import React from "react";
import { motion } from "framer-motion";
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
  Activity
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

export default function SingleBinDashboardCard({ singleBin, onCardClick }) {
  // Calculate fill level using the formula: Fill Level % = ((binHeight - sensorValue) / binHeight) × 100
  const fillPercentage = calculateFillLevel(
    singleBin.sensorValue || singleBin.sensor_value,
    singleBin.binHeight || singleBin.bin_height
  );
  
  const isOverThreshold = fillPercentage >= (singleBin.fill_threshold || 90);

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
  
  // Battery sensor - ALWAYS show, default to 0% if offline or no data
  if (singleBin.sensors_enabled?.battery_level) {
    const isOnline = singleBin.status === 'active' && 
                     singleBin.last_sensor_update && 
                     (Date.now() - new Date(singleBin.last_sensor_update).getTime()) < 60000;
    
    const batteryValue = (isOnline && singleBin.battery_level !== undefined) 
      ? singleBin.battery_level 
      : 0; // Default to 0% when offline or no data
    
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

  const isLiveActive = singleBin.last_sensor_update && 
    (Date.now() - new Date(singleBin.last_sensor_update).getTime()) < 60000;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`overflow-hidden transition-all duration-300 bg-gradient-to-br from-white via-white to-indigo-50/30 dark:from-[#2A1F3D] dark:via-[#241B3A] dark:to-[#1F0F2E] backdrop-blur-sm border-2 shadow-lg hover:shadow-xl cursor-pointer hover:scale-[1.02] ${
          isOverThreshold 
            ? 'border-red-500 dark:border-red-400 shadow-red-500/20 dark:shadow-red-400/30' 
            : 'border-indigo-200 dark:border-indigo-700'
        }`}
        onClick={() => onCardClick && onCardClick(singleBin, 'singlebin')}
      >
        <CardContent className="p-6">
          {/* Layer 1: Bin Information Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
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
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </motion.div>
                )}
              </div>
              {singleBin.location && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {singleBin.location}
                </p>
              )}
              {singleBin.description && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                  {singleBin.description}
                </p>
              )}
            </div>
            
            <Link to={createPageUrl("SmartBins")}>
              <Button 
                variant="ghost" 
                size="icon"
                className="dark:text-purple-200 dark:hover:bg-purple-600/30"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Layer 2: Compartment Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
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
            
            {/* Status Badge */}
            <div className="mt-2">
              <Badge className={`${
                singleBin.status === 'active' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
              } text-[10px]`}>
                {singleBin.status === 'active' ? '● Active' : '○ Suspended'}
              </Badge>
            </div>
          </div>

          {/* Layer 3: Fill Level Section - ONLY FILL LEVEL */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-xl p-4 mb-4 border border-indigo-200 dark:border-indigo-700">
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
            {/* Capacity and Alert Threshold Display */}
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

          {/* Layer 4: Compartment Sensor Section - ALL OTHER SENSORS */}
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

              {/* Sensor Grid - Dynamic Layout based on count */}
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
                      {/* Show offline badge for battery sensor when not connected */}
                      {sensor.type === 'battery' && sensor.isOffline && (
                        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-[9px] px-1.5 py-0">
                          Offline
                        </Badge>
                      )}
                    </div>
                    
                    {/* Value Display with Progress Bar */}
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
                      
                      {/* Progress bar for percentage-based sensors */}
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
                      
                      {/* Alert for low battery */}
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

              {/* Timestamp of last update */}
              {singleBin.last_sensor_update && (
                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700/40">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                    Last updated: {new Date(singleBin.last_sensor_update).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}