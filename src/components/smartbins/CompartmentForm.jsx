import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, RefreshCw, Copy, Check, BarChart3, Weight, Scan, DoorOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Compartment } from "@/api/entities";

export default function CompartmentForm({ compartment, smartBin, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    unique_id: compartment?.unique_id || "",
    label: compartment?.label || "",
    bin_type: compartment?.bin_type || "general_waste",
    capacity: compartment?.capacity || 50,
    fill_threshold: compartment?.fill_threshold || 90,
    data_endpoint: compartment?.data_endpoint || "",
    sensors_enabled: {
      fill_level: compartment?.sensors_enabled?.fill_level ?? true,
      weight: compartment?.sensors_enabled?.weight ?? false,
      odour_detection: compartment?.sensors_enabled?.odour_detection ?? false,
      lid_sensor: compartment?.sensors_enabled?.lid_sensor ?? false
    }
  });
  const [copied, setCopied] = useState(false);

  const generateUniqueId = useCallback(async () => {
    if (!smartBin || !formData.label) return;

    const cleanSmartBinName = smartBin.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const cleanCompartmentName = formData.label.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    
    try {
      const existingCompartments = await Compartment.filter({ smartbin_id: smartBin.id });
      const existingIds = existingCompartments
        .filter(c => c.unique_id && c.id !== compartment?.id)
        .map(c => c.unique_id);
      
      let sequenceNumber = 1;
      let proposedId;
      do {
        const sequenceStr = sequenceNumber.toString().padStart(3, '0');
        proposedId = `${cleanSmartBinName}-${cleanCompartmentName}-${sequenceStr}`;
        sequenceNumber++;
      } while (existingIds.includes(proposedId) && sequenceNumber <= 999);
      
      setFormData(prev => ({ ...prev, unique_id: proposedId }));
    } catch (error) {
      console.error("Error generating unique ID:", error);
      const sequenceStr = Math.floor(Math.random() * 999).toString().padStart(3, '0');
      const fallbackId = `${cleanSmartBinName}-${cleanCompartmentName}-${sequenceStr}`;
      setFormData(prev => ({ ...prev, unique_id: fallbackId }));
    }
  }, [smartBin, formData.label, compartment?.id]);

  useEffect(() => {
    if (smartBin && formData.label && !compartment) {
      generateUniqueId();
    }
  }, [smartBin, formData.label, compartment, generateUniqueId]);

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

  const compartmentSensorOptions = {
    fill_level: { label: 'Fill Level Sensor', icon: BarChart3, description: 'Ultrasonic/ToF sensor for fill monitoring', color: 'blue' },
    weight: { label: 'Weight Sensor', icon: Weight, description: 'Load cell weight measurement', color: 'purple' },
    odour_detection: { label: 'Odour Detection Sensor', icon: Scan, description: 'Gas sensor for odour level detection', color: 'orange' },
    lid_sensor: { label: 'Lid Open Sensor', icon: DoorOpen, description: 'Accelerometer lid status detection', color: 'indigo' }
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
          <div>
            <CardTitle className="dark:text-white">
              {compartment ? 'Edit Compartment' : 'Add New Compartment'}
            </CardTitle>
            {smartBin && (
              <p className="text-sm text-gray-500 dark:text-purple-200 mt-1">
                SmartBin: {smartBin.name}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="dark:text-purple-200">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Unique ID Section */}
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
                  placeholder="SmartBinName-CompartmentName-XXX"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={generateUniqueId}
                  disabled={!smartBin || !formData.label}
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
                  <strong>API Endpoint:</strong> PUT /api/entities/Compartment/{'{'}compartment_database_id{'}'}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Compartment Label</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => handleChange('label', e.target.value)}
                  placeholder="e.g., Main Recycling"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Bin Type</Label>
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

            {/* Capacity & Thresholds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Compartment Level Sensors */}
            <div>
              <Label className="text-base font-medium dark:text-purple-100 mb-4 block">Compartment Level Sensors (Individual)</Label>
              <p className="text-sm text-gray-500 dark:text-purple-200 mb-4">
                These sensors are specific to this compartment only
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(compartmentSensorOptions).map(([key, sensor]) => {
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
                disabled={!formData.unique_id || !formData.label}
              >
                {compartment ? 'Update Compartment' : 'Create Compartment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}