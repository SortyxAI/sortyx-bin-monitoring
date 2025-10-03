import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Thermometer, Droplets, Wind, Battery } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SmartBinForm({ smartBin, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: smartBin?.name || "",
    description: smartBin?.description || "",
    location: smartBin?.location || "",
    status: smartBin?.status || "active",
    temp_threshold: smartBin?.temp_threshold || 50,
    sensors_enabled: {
      temperature: smartBin?.sensors_enabled?.temperature ?? false,
      humidity: smartBin?.sensors_enabled?.humidity ?? false,
      air_quality: smartBin?.sensors_enabled?.air_quality ?? false,
      battery_level: smartBin?.sensors_enabled?.battery_level ?? false
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSensorToggle = (sensorKey) => {
    setFormData(prev => ({
      ...prev,
      sensors_enabled: {
        ...prev.sensors_enabled,
        [sensorKey]: !prev.sensors_enabled[sensorKey]
      }
    }));
  };

  const smartBinSensorOptions = {
    temperature: { label: 'Temperature Sensor', icon: Thermometer, description: 'Fire/combustion detection (SmartBin level)', color: 'red' },
    humidity: { label: 'Humidity Sensor', icon: Droplets, description: 'Environmental humidity monitoring (SmartBin level)', color: 'cyan' },
    air_quality: { label: 'Air Quality Sensor', icon: Wind, description: 'VOC and gas detection (SmartBin level)', color: 'green' },
    battery_level: { label: 'Battery Level Sensor', icon: Battery, description: 'IoT device battery monitoring (SmartBin level)', color: 'yellow' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="dark:bg-[#241B3A] dark:border-purple-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="dark:text-white">
            {smartBin ? 'Edit SmartBin' : 'Create New SmartBin'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="dark:text-purple-200">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-purple-100">SmartBin Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Main Office Bin"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="dark:text-purple-100">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="active" className="dark:text-white">Active</SelectItem>
                    <SelectItem value="inactive" className="dark:text-white">Inactive</SelectItem>
                    <SelectItem value="maintenance" className="dark:text-white">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="dark:text-purple-100">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Building A, Floor 2"
                className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="dark:text-purple-100">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of this SmartBin..."
                rows={3}
                className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temp_threshold" className="dark:text-purple-100">Temperature Alert Threshold (°C)</Label>
              <Input
                id="temp_threshold"
                type="number"
                value={formData.temp_threshold}
                onChange={(e) => handleChange('temp_threshold', Number(e.target.value))}
                className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
              />
            </div>

            {/* SmartBin Level Sensors */}
            <div>
              <Label className="text-base font-medium dark:text-purple-100 mb-4 block">SmartBin Level Sensors (Common to All Compartments)</Label>
              <p className="text-sm text-gray-500 dark:text-purple-200 mb-4">
                These sensors are at the SmartBin level and shared across all compartments
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(smartBinSensorOptions).map(([key, sensor]) => {
                  const isEnabled = formData.sensors_enabled[key];
                  const Icon = sensor.icon;
                  
                  return (
                    <motion.div
                      key={key}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        isEnabled
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-400 shadow-lg'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F0F2E]/60 hover:border-green-300 dark:hover:border-green-500 hover:shadow-md'
                      }`}
                      onClick={() => handleSensorToggle(key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      layout
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon className={`w-6 h-6 ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              isEnabled 
                                ? 'text-green-700 dark:text-green-200' 
                                : 'text-gray-900 dark:text-purple-100'
                            }`}>
                              {sensor.label}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              isEnabled
                                ? 'text-green-600 dark:text-green-300'
                                : 'text-gray-500 dark:text-purple-300'
                            }`}>
                              {sensor.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isEnabled
                            ? 'bg-green-600 border-green-600 scale-110'
                            : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        }`}>
                          {isEnabled && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-white text-sm font-bold"
                            >
                              ✓
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      {isEnabled && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-2 right-8"
                        >
                          <Badge className="bg-green-600 text-white text-xs">
                            ACTIVE
                          </Badge>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-purple-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="dark:border-purple-600 dark:text-purple-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
              >
                {smartBin ? 'Update' : 'Create'} SmartBin
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}