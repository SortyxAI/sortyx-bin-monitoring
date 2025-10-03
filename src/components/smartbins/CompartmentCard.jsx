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
  Weight,
  Hash,
  Copy,
  Check
} from "lucide-react";
import { useState } from "react";

export default function CompartmentCard({ compartment, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const enabledSensors = Object.entries(compartment.sensors_enabled || {})
    .filter(([_, enabled]) => enabled)
    .map(([sensor]) => sensor);

  const fillPercentage = compartment.current_fill || 0;
  const fillColor = fillPercentage > 90 ? 'bg-red-500' : 
                   fillPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  const binTypeColors = {
    recyclable: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    general_waste: 'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300',
    compost: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    organic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    hazardous: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  };

  const copyUniqueId = async () => {
    if (compartment.unique_id) {
      await navigator.clipboard.writeText(compartment.unique_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="relative hover:shadow-md transition-shadow dark:bg-[#1F1235] dark:border-purple-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg dark:text-white">{compartment.label}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={binTypeColors[compartment.bin_type] || 'bg-gray-100 text-gray-700'}>
                {compartment.bin_type.replace('_', ' ')}
              </Badge>
              {compartment.unique_id && (
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">ID</span>
                </div>
              )}
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
        {/* Unique ID Display */}
        {compartment.unique_id && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Hash className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Sensor Endpoint ID</span>
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
              {compartment.unique_id}
            </code>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Use this ID for sensor data API calls
            </p>
          </div>
        )}

        {/* Capacity */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-300">Capacity</span>
            <span className="font-medium dark:text-white">{compartment.capacity}L</span>
          </div>
        </div>

        {/* Fill Level */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-300">Fill Level</span>
            <span className="font-medium dark:text-white">{fillPercentage}%</span>
          </div>
          <Progress value={fillPercentage} className="h-2" />
        </div>

        {/* Current Sensor Values */}
        {compartment.temperature && enabledSensors.includes('temperature') && (
          <div className="flex items-center gap-2 text-sm">
            <Thermometer className="w-4 h-4 text-red-500" />
            <span className="dark:text-gray-300">{compartment.temperature}°C</span>
          </div>
        )}

        {compartment.humidity && enabledSensors.includes('humidity') && (
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="dark:text-gray-300">{compartment.humidity}%</span>
          </div>
        )}

        {compartment.weight && enabledSensors.includes('weight') && (
          <div className="flex items-center gap-2 text-sm">
            <Weight className="w-4 h-4 text-gray-600" />
            <span className="dark:text-gray-300">{compartment.weight}kg</span>
          </div>
        )}

        {compartment.air_quality && enabledSensors.includes('air_quality') && (
          <div className="flex items-center gap-2 text-sm">
            <Wind className="w-4 h-4 text-green-500" />
            <span className="dark:text-gray-300">AQI {compartment.air_quality}</span>
          </div>
        )}

        {/* Thresholds */}
        <div className="pt-2 border-t dark:border-purple-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Fill Alert: {compartment.fill_threshold}%</span>
            {enabledSensors.includes('temperature') && (
              <span>Temp Alert: {compartment.temp_threshold}°C</span>
            )}
          </div>
        </div>

        {/* Enabled Sensors */}
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