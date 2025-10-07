import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Edit, 
  Trash2,
  Thermometer,
  Droplets,
  Wind,
  Battery,
  Hash,
  Copy,
  Check,
  BarChart3,
  Scan,
  MapPin
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SingleBinCard({ singleBin, onEdit, onDelete, onCardClick }) {
  const [copied, setCopied] = useState(false);

  const enabledSensors = Object.entries(singleBin.sensors_enabled || {})
    .filter(([_, enabled]) => enabled)
    .map(([sensor]) => sensor);

  const fillPercentage = singleBin.current_fill || 0;
  const fillColor = fillPercentage > 90 ? 'bg-red-500' : 
                   fillPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  const binTypeColors = {
    recyclable: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    general_waste: 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300',
    compost: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    organic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    hazardous: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
    inactive: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
    maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200'
  };

  const copyUniqueId = async () => {
    if (singleBin.unique_id) {
      await navigator.clipboard.writeText(singleBin.unique_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sensorData = [];
  
  // Show sensor only if it's enabled in sensors_enabled configuration
  // If sensor is enabled but has no data, show 0
  if (singleBin.sensors_enabled?.fill_level) {
    sensorData.push({
      type: 'fill_level',
      value: singleBin.current_fill ?? 0,
      unit: '%',
      icon: BarChart3,
      color: fillPercentage > 90 ? 'text-red-500' : fillPercentage > 70 ? 'text-yellow-500' : 'text-green-500'
    });
  }
  
  if (singleBin.sensors_enabled?.temperature) {
    const tempValue = singleBin.temperature ?? 0;
    sensorData.push({
      type: 'temperature',
      value: tempValue,
      unit: '°C',
      icon: Thermometer,
      color: tempValue > (singleBin.temp_threshold || 50) ? 'text-red-500' : 'text-blue-500'
    });
  }
  
  if (singleBin.sensors_enabled?.humidity) {
    sensorData.push({
      type: 'humidity',
      value: singleBin.humidity ?? 0,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-400'
    });
  }
  
  if (singleBin.sensors_enabled?.air_quality) {
    const aqValue = singleBin.air_quality ?? 0;
    sensorData.push({
      type: 'air_quality',
      value: aqValue,
      unit: 'AQI',
      icon: Wind,
      color: aqValue > 150 ? 'text-red-500' : aqValue > 100 ? 'text-yellow-500' : 'text-green-500'
    });
  }

  if (singleBin.sensors_enabled?.battery_level) {
    const batteryValue = singleBin.battery_level ?? 0;
    sensorData.push({
      type: 'battery_level',
      value: batteryValue,
      unit: '%',
      icon: Battery,
      color: batteryValue < 20 ? 'text-red-500' : batteryValue < 50 ? 'text-yellow-500' : 'text-green-500'
    });
  }

  if (singleBin.sensors_enabled?.odour_detection) {
    const odourValue = singleBin.odour_level ?? 0;
    sensorData.push({
      type: 'odour',
      value: odourValue,
      unit: '',
      icon: Scan,
      color: odourValue > 70 ? 'text-red-500' : 'text-green-500'
    });
  }

  return (
    <Card 
      className="relative hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer dark:bg-[#1F1235] dark:border-purple-700" 
      onClick={() => onCardClick && onCardClick(singleBin, 'singlebin')}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg dark:text-white flex items-center gap-2">
              {singleBin.name}
              <Badge className={statusColors[singleBin.status]}>
                {singleBin.status}
              </Badge>
            </CardTitle>
            {singleBin.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <MapPin className="w-4 h-4" />
                {singleBin.location}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge className={binTypeColors[singleBin.bin_type] || 'bg-gray-100 text-gray-700'}>
                {singleBin.bin_type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 dark:text-gray-300 dark:hover:bg-purple-600/20">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-[#241B3A] dark:border-purple-700">
              <DropdownMenuItem onClick={onEdit} className="dark:text-gray-200 dark:hover:bg-purple-500/20">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {singleBin.unique_id && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Hash className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">API Endpoint ID</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyUniqueId}
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <code className="text-xs font-mono text-blue-800 dark:text-blue-200 block break-all bg-white/50 dark:bg-black/20 p-2 rounded border">
              {singleBin.unique_id}
            </code>
          </div>
        )}

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-300">Capacity</span>
            <span className="font-medium dark:text-white">{singleBin.capacity}L</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-300">Fill Level</span>
            <span className="font-medium dark:text-white">{fillPercentage}%</span>
          </div>
          <Progress value={fillPercentage} className="h-2" />
        </div>

        {sensorData.length > 0 && (
          <div className="pt-3 border-t dark:border-purple-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sensor Readings:</div>
            <div className="grid grid-cols-2 gap-2">
              {sensorData.map((sensor) => (
                <motion.div
                  key={sensor.type}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/80 dark:bg-purple-900/30 rounded-md p-2 border border-gray-200 dark:border-purple-600/30"
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
        )}

        <div className="pt-2 border-t dark:border-purple-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Fill Alert: {singleBin.fill_threshold}%</span>
            {singleBin.sensors_enabled?.temperature && (
              <span>Temp Alert: {singleBin.temp_threshold}°C</span>
            )}
          </div>
        </div>

        <div className="pt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Sensors:</div>
          <div className="flex flex-wrap gap-1">
            {enabledSensors.map(sensor => (
              <Badge
                key={sensor}
                variant="outline"
                className="text-xs py-0 px-1 dark:border-purple-500 dark:text-gray-300"
              >
                {sensor.replace('_', ' ')}
              </Badge>
            ))}
            {enabledSensors.length === 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">None configured</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}