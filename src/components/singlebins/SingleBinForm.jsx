import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, RefreshCw, Copy, Check, Thermometer, Droplets, Wind, Battery, BarChart3, Scan } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SingleBinForm({ singleBin, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: singleBin?.name || "",
    unique_id: singleBin?.unique_id || "",
    description: singleBin?.description || "",
    location: singleBin?.location || "",
    bin_type: singleBin?.bin_type || "general_waste",
    status: singleBin?.status || "active",
    capacity: singleBin?.capacity || 100,
    current_fill: singleBin?.current_fill || 0,
    fill_threshold: singleBin?.fill_threshold || 90,
    temp_threshold: singleBin?.temp_threshold || 50,
    sensors_enabled: {
      temperature: singleBin?.sensors_enabled?.temperature ?? false,
      humidity: singleBin?.sensors_enabled?.humidity ?? false,
      air_quality: singleBin?.sensors_enabled?.air_quality ?? false,
      fill_level: singleBin?.sensors_enabled?.fill_level ?? true,
      battery_level: singleBin?.sensors_enabled?.battery_level ?? false,
      odour_detection: singleBin?.sensors_enabled?.odour_detection ?? false
    }
  });
  
  const [copied, setCopied] = useState(false);

  const generateUniqueId = () => {
    const cleanName = formData.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
    const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    const proposedId = `SB-${cleanName}-${randomNum}`;
    setFormData(prev => ({ ...prev, unique_id: proposedId }));
  };

  const copyUniqueId = async () => {
    if (formData.unique_id) {
      await navigator.clipboard.writeText(formData.unique_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  const sensorOptions = {
    fill_level: { label: 'Fill Level Sensor', icon: BarChart3, description: 'Ultrasonic/ToF sensor for fill monitoring', color: 'blue' },
    temperature: { label: 'Temperature Sensor', icon: Thermometer, description: 'Fire/combustion detection', color: 'red' },
    humidity: { label: 'Humidity Sensor', icon: Droplets, description: 'Environmental humidity monitoring', color: 'cyan' },
    air_quality: { label: 'Air Quality Sensor', icon: Wind, description: 'VOC and gas detection', color: 'green' },
    battery_level: { label: 'Battery Level Sensor', icon: Battery, description: 'IoT device battery monitoring', color: 'yellow' },
    odour_detection: { label: 'Odour Detection Sensor', icon: Scan, description: 'Gas sensor for odour level detection', color: 'orange' }
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
            {singleBin ? 'Edit SingleBin' : 'Add New SingleBin'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="dark:text-purple-200">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <Label className="text-base font-medium text-blue-800 dark:text-blue-200">Unique Compartment ID</Label>
              <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                This ID will be used in API endpoints to receive sensor data
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={formData.unique_id}
                  onChange={(e) => handleChange('unique_id', e.target.value)}
                  className="font-mono text-sm dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  placeholder="SB-BinName-XXX"
                  required
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={generateUniqueId}
                  disabled={!formData.name}
                  className="dark:border-purple-600"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={copyUniqueId}
                  disabled={!formData.unique_id}
                  className="dark:border-purple-600"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              {formData.unique_id && (
                <div className="text-xs text-blue-600 dark:text-blue-300">
                  <strong>API Endpoint:</strong> PUT /api/entities/SingleBin/{'{'}singlebin_database_id{'}'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-purple-100">SingleBin Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Reception Waste Bin"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Bin Type *</Label>
                <Select value={formData.bin_type} onValueChange={(value) => handleChange('bin_type', value)}>
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="recyclable" className="dark:text-white">Recyclable</SelectItem>
                    <SelectItem value="general_waste" className="dark:text-white">General Waste</SelectItem>
                    <SelectItem value="compost" className="dark:text-white">Compost</SelectItem>
                    <SelectItem value="organic" className="dark:text-white">Organic</SelectItem>
                    <SelectItem value="hazardous" className="dark:text-white">Hazardous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-purple-100">Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Building A, Main Entrance"
                className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="dark:text-purple-100">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description..."
                rows={3}
                className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Capacity (Liters)</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', Number(e.target.value))}
                  min="1"
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Fill Alert Threshold (%)</Label>
                <Input
                  type="number"
                  value={formData.fill_threshold}
                  onChange={(e) => handleChange('fill_threshold', Number(e.target.value))}
                  min="1"
                  max="100"
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
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

            <div>
              <Label className="text-base font-medium dark:text-purple-100 mb-4 block">Sensors Configuration</Label>
              <p className="text-sm text-gray-500 dark:text-purple-200 mb-4">
                Select which sensors are enabled for this SingleBin
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sensorOptions).map(([key, sensor]) => {
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
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <h4 className={`font-medium text-sm ${
                              isEnabled 
                                ? 'text-green-700 dark:text-green-200' 
                                : 'text-gray-900 dark:text-purple-100'
                            }`}>
                              {sensor.label}
                            </h4>
                            <p className={`text-xs mt-1 ${
                              isEnabled
                                ? 'text-green-600 dark:text-green-300'
                                : 'text-gray-500 dark:text-purple-300'
                            }`}>
                              {sensor.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isEnabled
                            ? 'bg-green-600 border-green-600 scale-110'
                            : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        }`}>
                          {isEnabled && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-white text-xs font-bold"
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
                          className="absolute top-2 right-2"
                        >
                          <Badge className="bg-green-600 text-white text-[10px] px-1 py-0">
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
                disabled={!formData.name || !formData.unique_id}
              >
                {singleBin ? 'Update' : 'Create'} SingleBin
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}