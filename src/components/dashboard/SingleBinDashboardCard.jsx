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
  MapPin
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SingleBinPieChart = ({ singleBin }) => {
  const fillLevel = singleBin.current_fill || 0;
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
  const fillPercentage = singleBin.current_fill || 0;
  const isOverThreshold = fillPercentage >= (singleBin.fill_threshold || 90);
  
  const binTypeColors = {
    recyclable: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    general_waste: 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300',
    compost: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    organic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    hazardous: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    singlebin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    mixed: 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
  };

  const sensorData = [];
  
  if (singleBin.sensors_enabled?.temperature && singleBin.temperature !== undefined) {
    sensorData.push({
      type: 'temperature',
      value: singleBin.temperature,
      unit: '°C',
      icon: Thermometer,
      color: singleBin.temperature > (singleBin.temp_threshold || 50) ? 'text-red-500' : 'text-blue-500'
    });
  }
  
  if (singleBin.sensors_enabled?.humidity && singleBin.humidity !== undefined) {
    sensorData.push({
      type: 'humidity',
      value: singleBin.humidity,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-400'
    });
  }
  
  if (singleBin.sensors_enabled?.air_quality && singleBin.air_quality !== undefined) {
    sensorData.push({
      type: 'air_quality',
      value: singleBin.air_quality,
      unit: 'AQI',
      icon: Wind,
      color: singleBin.air_quality > 150 ? 'text-red-500' : singleBin.air_quality > 100 ? 'text-yellow-500' : 'text-green-500'
    });
  }

  if (singleBin.sensors_enabled?.battery_level && singleBin.battery_level !== undefined) {
    sensorData.push({
      type: 'battery',
      value: singleBin.battery_level,
      unit: '%',
      icon: Battery,
      color: singleBin.battery_level < 20 ? 'text-red-500' : singleBin.battery_level < 50 ? 'text-yellow-500' : 'text-green-500'
    });
  }

  if (singleBin.sensors_enabled?.odour_detection && singleBin.odour_level !== undefined) {
    sensorData.push({
      type: 'odour',
      value: singleBin.odour_level,
      unit: '',
      icon: Scan,
      color: singleBin.odour_level > 70 ? 'text-red-500' : 'text-green-500'
    });
  }

  const isLiveActive = singleBin.last_sensor_update && 
    (Date.now() - new Date(singleBin.last_sensor_update).getTime()) < 60000; // Live if updated in last 60 seconds

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
          {/* Header */}
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
              <Badge className={`${binTypeColors[singleBin.bin_type || singleBin.type]} mt-2`}>
                {(singleBin.bin_type || singleBin.type || 'mixed').replace('_', ' ')}
              </Badge>
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

          {/* Fill Level Section */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-xl p-4 mb-4 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center gap-4">
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
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Capacity: {singleBin.capacity}L • Alert: {singleBin.fill_threshold}%
                </div>
              </div>
            </div>
          </div>

          {/* Sensor Data Section */}
          {sensorData.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-700/40">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <span>Sensor Readings</span>
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
                      className={`text-[9px] px-1 py-0 ${
                        isLiveActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {isLiveActive ? 'LIVE' : 'OFFLINE'}
                    </Badge>
                  </motion.div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {sensorData.map((sensor, index) => (
                  <motion.div
                    key={sensor.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 dark:bg-amber-800/30 rounded-md p-3 border border-amber-200 dark:border-amber-600/30 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <sensor.icon className={`w-4 h-4 ${sensor.color}`} />
                      <span className="text-xs text-gray-600 dark:text-gray-200 uppercase tracking-wide">
                        {sensor.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-base font-bold text-gray-900 dark:text-white">
                      {sensor.value}{sensor.unit}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}