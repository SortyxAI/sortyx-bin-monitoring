import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, RefreshCw, Copy, Check, BarChart3, Weight, Scan, DoorOpen, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Compartment } from "@/api/entities";
import { User } from "@/api/entities";
import { FirebaseService } from "@/services/firebaseService";

export default function CompartmentForm({ compartment, smartBin, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    compartment_name: compartment?.compartment_name || "",
    bin_type: compartment?.bin_type || "general_waste",
    deviceId: compartment?.deviceId || "",
    device_id: compartment?.device_id || "",
    capacity: compartment?.capacity || 50,
    binHeight: compartment?.binHeight || 100,
    fill_threshold: compartment?.fill_threshold || 90,
    status: compartment?.status || "active",
    sensors_enabled: {
      fill_level: compartment?.sensors_enabled?.fill_level ?? true,
      weight: compartment?.sensors_enabled?.weight ?? false,
      odour_detection: compartment?.sensors_enabled?.odour_detection ?? false,
      lid_sensor: compartment?.sensors_enabled?.lid_sensor ?? false
    }
  });
  
  const [copied, setCopied] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [userAppId, setUserAppId] = useState(null);

  // Load user's App ID and available IoT devices
  useEffect(() => {
    loadUserAndDevices();
  }, []);

  const loadUserAndDevices = async () => {
    try {
      // Get current user
      const currentUser = await User.me();
      console.log('Current user:', currentUser);
      
      // Check if admin is impersonating another user
      const impersonatedUserStr = localStorage.getItem('impersonatedUser');
      const effectiveUser = impersonatedUserStr ? JSON.parse(impersonatedUserStr) : currentUser;
      
      // Get user's App ID - use 'sortyx-iot' as default if not found
      const appId = effectiveUser.app_id || effectiveUser.appId || 'sortyx-iot';
      console.log('Using App ID for device filtering:', appId);
      setUserAppId(appId);
      
      // Load devices filtered by App ID
      const devices = await FirebaseService.getAvailableDevices(appId);
      console.log('Available devices for App ID:', appId, devices);
      setAvailableDevices(devices || []);
    } catch (error) {
      console.error('Error loading user and devices:', error);
      setAvailableDevices([]);
    }
  };

  const generateCompartmentName = useCallback(async () => {
    if (!smartBin || !formData.bin_type) return;

    const cleanBinName = smartBin.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const binTypeMap = {
      'general_waste': 'GEN',
      'recyclable': 'REC',
      'organic': 'ORG',
      'compost': 'COM',
      'hazardous': 'HAZ'
    };
    const binTypeCode = binTypeMap[formData.bin_type] || 'BIN';
    
    try {
      const existingCompartments = await Compartment.filter({ smartbin_id: smartBin.id });
      const existingNames = existingCompartments
        .filter(c => c.compartment_name && c.id !== compartment?.id)
        .map(c => c.compartment_name);
      
      let sequenceNumber = 1;
      let proposedName;
      do {
        const sequenceStr = sequenceNumber.toString().padStart(3, '0');
        proposedName = `${cleanBinName}-${binTypeCode}-${sequenceStr}`;
        sequenceNumber++;
      } while (existingNames.includes(proposedName) && sequenceNumber <= 999);
      
      setFormData(prev => ({ ...prev, compartment_name: proposedName }));
    } catch (error) {
      console.error("Error generating compartment name:", error);
      const sequenceStr = Math.floor(Math.random() * 999).toString().padStart(3, '0');
      const fallbackName = `${cleanBinName}-${binTypeCode}-${sequenceStr}`;
      setFormData(prev => ({ ...prev, compartment_name: fallbackName }));
    }
  }, [smartBin, formData.bin_type, compartment?.id]);

  useEffect(() => {
    if (smartBin && formData.bin_type && !compartment) {
      generateCompartmentName();
    }
  }, [smartBin, formData.bin_type, compartment, generateCompartmentName]);

  const copyCompartmentName = async () => {
    if (formData.compartment_name) {
      await navigator.clipboard.writeText(formData.compartment_name);
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
            {/* Layer 2 Information Banner */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>Layer 2: Compartment Configuration</strong> - Configure compartment-specific settings including IoT device, bin type, capacity, and sensors.
              </p>
            </div>

            {/* Auto-Generated Compartment Name */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <Label className="text-base font-medium text-blue-800 dark:text-blue-200">Unique Compartment Name (Auto-Generated)</Label>
              <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                Format: BinName + CompartmentType + Sequence (e.g., MainOffice-REC-001)
              </p>
              
              <div className="flex items-center gap-2">
                <Input
                  value={formData.compartment_name}
                  readOnly
                  className="font-mono text-sm font-bold dark:bg-[#1F1235] dark:border-purple-600 dark:text-white bg-gray-50"
                  placeholder="Will be auto-generated..."
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={generateCompartmentName}
                  disabled={!smartBin || !formData.bin_type}
                  className="dark:border-purple-600"
                  title="Regenerate Name"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={copyCompartmentName}
                  disabled={!formData.compartment_name}
                  className="dark:border-purple-600"
                  title="Copy Name"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Bin Type & IoT Device */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Bin Type *</Label>
                <Select 
                  value={formData.bin_type} 
                  onValueChange={(value) => {
                    handleChange('bin_type', value);
                    // Trigger name regeneration when bin type changes
                    setTimeout(() => generateCompartmentName(), 100);
                  }}
                >
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="general_waste" className="dark:text-white">General Waste</SelectItem>
                    <SelectItem value="recyclable" className="dark:text-white">Recyclable</SelectItem>
                    <SelectItem value="organic" className="dark:text-white">Organic</SelectItem>
                    <SelectItem value="compost" className="dark:text-white">Compost</SelectItem>
                    <SelectItem value="hazardous" className="dark:text-white">Hazardous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-purple-100">IoT Device *</Label>
                <Select 
                  value={formData.deviceId} 
                  onValueChange={(value) => {
                    handleChange('deviceId', value);
                    handleChange('device_id', value);
                  }}
                >
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue placeholder="Select IoT Device" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    {availableDevices.length > 0 ? (
                      availableDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId} className="dark:text-white">
                          <div className="flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-green-500" />
                            {device.deviceId}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-devices" disabled className="dark:text-gray-400">
                        No devices available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Capacity, Height, Threshold */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Capacity (Liters) *</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', Number(e.target.value))}
                  min="1"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Bin Height (cms) *</Label>
                <Input
                  type="number"
                  value={formData.binHeight}
                  onChange={(e) => handleChange('binHeight', Number(e.target.value))}
                  min="1"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-purple-100">Threshold Alert % *</Label>
                <Input
                  type="number"
                  value={formData.fill_threshold}
                  onChange={(e) => handleChange('fill_threshold', Number(e.target.value))}
                  min="1"
                  max="100"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="dark:text-purple-100">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                  <SelectItem value="active" className="dark:text-white">Active</SelectItem>
                  <SelectItem value="suspended" className="dark:text-white">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sensor Configuration Button */}
            <div className="border-t border-gray-200 dark:border-purple-700 pt-4">
              <Label className="text-base font-medium dark:text-purple-100 mb-4 block">Sensor Configuration</Label>
              <p className="text-sm text-gray-500 dark:text-purple-200 mb-4">
                Configure which sensors are enabled for this compartment
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
                disabled={!formData.compartment_name || !formData.bin_type || !formData.deviceId}
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