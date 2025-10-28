import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, RefreshCw, Copy, Check, Thermometer, Droplets, Wind, Battery, BarChart3, Scan, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FirebaseService } from "@/services/firebaseService";

export default function SingleBinForm({ singleBin, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    // Layer 1: Bin Level (Parent)
    name: singleBin?.name || "",
    location: singleBin?.location || "",
    description: singleBin?.description || "",
    
    // Layer 2: Compartment Level (Child)
    compartment_name: singleBin?.compartment_name || "",
    iot_device_id: singleBin?.iot_device_id || "",
    bin_type: singleBin?.bin_type || "general_waste",
    capacity: singleBin?.capacity || 100,
    bin_height: singleBin?.bin_height || 50,
    status: singleBin?.status || "active",
    current_fill: singleBin?.current_fill || 0,
    fill_threshold: singleBin?.fill_threshold || 90,
    battery_threshold: singleBin?.battery_threshold || 20,
    temp_threshold: singleBin?.temp_threshold || 50,
    sensors_enabled: {
      temperature: singleBin?.sensors_enabled?.temperature ?? false,
      humidity: singleBin?.sensors_enabled?.humidity ?? false,
      air_quality: singleBin?.sensors_enabled?.air_quality ?? false,
      fill_level: singleBin?.sensors_enabled?.fill_level ?? true,
      battery_level: singleBin?.sensors_enabled?.battery_level ?? true,
      odour_detection: singleBin?.sensors_enabled?.odour_detection ?? false
    }
  });
  
  const [copied, setCopied] = useState(false);
  const [copiedDevice, setCopiedDevice] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState(null);

  // Fetch available IoT devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      setLoadingDevices(true);
      setDevicesError(null);
      try {
        console.log('Fetching available IoT devices...');
        const devices = await FirebaseService.getAvailableDevices();
        console.log('Available devices:', devices);
        setAvailableDevices(devices);
        
        if (devices.length === 0) {
          setDevicesError('No IoT devices found. Please ensure devices are sending data to Firestore.');
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
        setDevicesError('Failed to load devices. Please try again.');
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchDevices();
  }, []);

  const generateCompartmentName = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const proposedName = `COMP-${randomStr}`;
    setFormData(prev => ({ ...prev, compartment_name: proposedName }));
  };

  const copyCompartmentName = async () => {
    if (formData.compartment_name) {
      await navigator.clipboard.writeText(formData.compartment_name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyDeviceId = async () => {
    if (formData.iot_device_id) {
      await navigator.clipboard.writeText(formData.iot_device_id);
      setCopiedDevice(true);
      setTimeout(() => setCopiedDevice(false), 2000);
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

  const handleDeviceRefresh = async () => {
    setLoadingDevices(true);
    setDevicesError(null);
    try {
      const devices = await FirebaseService.getAvailableDevices();
      setAvailableDevices(devices);
      
      if (devices.length === 0) {
        setDevicesError('No IoT devices found.');
      }
    } catch (error) {
      console.error('Error refreshing devices:', error);
      setDevicesError('Failed to refresh devices.');
    } finally {
      setLoadingDevices(false);
    }
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
            {/* Layer 1: Bin Level (Parent) */}
            <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-purple-600 text-white">Layer 1</Badge>
                <Label className="text-lg font-bold text-purple-800 dark:text-purple-200">
                  Bin Information (Parent Level)
                </Label>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-300 mb-4">
                High-level bin identification and location details
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dark:text-purple-100">Bin Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Reception Waste Bin"
                    required
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
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
              </div>

              <div className="space-y-2 mt-4">
                <Label className="dark:text-purple-100">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of the bin..."
                  rows={2}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>

            {/* Layer 2: Compartment Level (Child) */}
            <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-blue-600 text-white">Layer 2</Badge>
                <Label className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  Compartment Details (Operational Level)
                </Label>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                Technical specifications, IoT connectivity, and sensor configuration
              </p>

              {/* Auto-generated Compartment Name */}
              <div className="p-4 bg-white dark:bg-[#1F1235] rounded-lg border border-blue-300 dark:border-blue-600 mb-4">
                <Label className="text-base font-medium text-blue-800 dark:text-blue-200">Auto-Generated Compartment Name</Label>
                <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                  Unique compartment identifier for tracking and API integration
                </p>
                
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.compartment_name}
                    readOnly
                    className="font-mono text-sm dark:bg-[#241B3A] dark:border-purple-600 dark:text-white bg-gray-50"
                    placeholder="COMP-XXXXXX"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={generateCompartmentName}
                    className="dark:border-purple-600"
                    title="Generate Compartment Name"
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
                    title="Copy Compartment Name"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* IoT Device ID */}
              <div className="p-4 bg-white dark:bg-[#1F1235] rounded-lg border border-blue-300 dark:border-blue-600 mb-4">
                <Label className="text-base font-medium text-blue-800 dark:text-blue-200">IoT Device ID</Label>
                <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                  Select a connected sensor device from the dropdown (devices are auto-discovered from Firestore)
                </p>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={formData.iot_device_id}
                    onValueChange={(value) => handleChange('iot_device_id', value)}
                    disabled={loadingDevices}
                  >
                    <SelectTrigger className="font-mono text-sm dark:bg-[#241B3A] dark:border-purple-600 dark:text-white">
                      <SelectValue placeholder={loadingDevices ? "Loading devices..." : "Select IoT Device"} />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#241B3A] dark:border-blue-700">
                      {availableDevices.length === 0 && !loadingDevices ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                          No devices found
                        </div>
                      ) : (
                        availableDevices.map((device) => (
                          <SelectItem 
                            key={device.id} 
                            value={device.id} 
                            className="dark:text-white font-mono text-sm"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{device.deviceId || device.id}</span>
                              {device.applicationId && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {device.applicationId}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleDeviceRefresh}
                    disabled={loadingDevices}
                    className="dark:border-purple-600"
                    title="Refresh Devices"
                  >
                    {loadingDevices ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={copyDeviceId}
                    disabled={!formData.iot_device_id}
                    className="dark:border-purple-600"
                    title="Copy Device ID"
                  >
                    {copiedDevice ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {devicesError && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{devicesError}</p>
                  </div>
                )}
                {availableDevices.length > 0 && !loadingDevices && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      ✓ Found {availableDevices.length} device{availableDevices.length !== 1 ? 's' : ''} from Firestore
                    </p>
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="dark:text-blue-100">Bin Type *</Label>
                  <Select value={formData.bin_type} onValueChange={(value) => handleChange('bin_type', value)}>
                    <SelectTrigger className="dark:bg-[#1F1235] dark:border-blue-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#241B3A] dark:border-blue-700">
                      <SelectItem value="recyclable" className="dark:text-white">Recyclable</SelectItem>
                      <SelectItem value="general_waste" className="dark:text-white">General Waste</SelectItem>
                      <SelectItem value="compost" className="dark:text-white">Compost</SelectItem>
                      <SelectItem value="organic" className="dark:text-white">Organic</SelectItem>
                      <SelectItem value="hazardous" className="dark:text-white">Hazardous</SelectItem>
                      <SelectItem value="mixed" className="dark:text-white">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-blue-100">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger className="dark:bg-[#1F1235] dark:border-blue-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#241B3A] dark:border-blue-700">
                      <SelectItem value="active" className="dark:text-white">Active</SelectItem>
                      <SelectItem value="suspended" className="dark:text-white">Suspended</SelectItem>
                      <SelectItem value="maintenance" className="dark:text-white">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="dark:text-blue-100">Capacity (L)</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', Number(e.target.value))}
                    min="1"
                    className="dark:bg-[#1F1235] dark:border-blue-600 dark:text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="dark:text-blue-100">Height (cm)</Label>
                  <Input
                    type="number"
                    value={formData.bin_height}
                    onChange={(e) => handleChange('bin_height', Number(e.target.value))}
                    min="1"
                    className="dark:bg-[#1F1235] dark:border-blue-600 dark:text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="dark:text-blue-100">Fill Alert (%)</Label>
                  <Input
                    type="number"
                    value={formData.fill_threshold}
                    onChange={(e) => handleChange('fill_threshold', Number(e.target.value))}
                    min="1"
                    max="100"
                    className="dark:bg-[#1F1235] dark:border-blue-600 dark:text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="dark:text-blue-100">Battery Alert (%)</Label>
                  <Input
                    type="number"
                    value={formData.battery_threshold}
                    onChange={(e) => handleChange('battery_threshold', Number(e.target.value))}
                    min="1"
                    max="100"
                    className="dark:bg-[#1F1235] dark:border-blue-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Sensors Configuration */}
              <div>
                <Label className="text-base font-medium dark:text-blue-100 mb-3 block">Sensors Configuration</Label>
                <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                  Select which sensors are enabled for this compartment
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
                                  : 'text-gray-900 dark:text-blue-100'
                              }`}>
                                {sensor.label}
                              </h4>
                              <p className={`text-xs mt-1 ${
                                isEnabled
                                  ? 'text-green-600 dark:text-green-300'
                                  : 'text-gray-500 dark:text-blue-300'
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
                disabled={!formData.name || !formData.compartment_name}
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