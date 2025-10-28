import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi, Check, BarChart3, Battery, Thermometer, Droplets, Wind, Scan } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FirebaseService } from '@/services/firebaseService';
import { SmartBin, User } from '@/api/entities';

const ImprovedAddBinModal = ({ isOpen, onClose, onAddBin, binType = 'single', existingBin = null }) => {
  // Step 1: Basic Details
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    deviceId: '',
    capacity: 100,
    binHeight: 100,
    bin_type: 'general_waste',
    description: '',
    status: 'active'
  });

  // Step 2: Sensor Configuration
  const [sensorsEnabled, setSensorsEnabled] = useState({
    fill_level: false,
    battery_level: false,
    temperature: false,
    humidity: false,
    air_quality: false,
    odour_detection: false
  });

  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceData, setSelectedDeviceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [userAppId, setUserAppId] = useState(null);

  // Load existing bin data when modal opens in edit mode
  useEffect(() => {
    if (isOpen && existingBin) {
      console.log('Loading existing bin data:', existingBin);
      setFormData({
        name: existingBin.name || '',
        location: existingBin.location || '',
        deviceId: existingBin.deviceId || existingBin.device_id || '',
        capacity: existingBin.capacity || 100,
        binHeight: existingBin.binHeight || 100,
        bin_type: existingBin.bin_type || 'general_waste',
        description: existingBin.description || '',
        status: existingBin.status || 'active'
      });
      setSensorsEnabled(existingBin.sensors_enabled || {
        fill_level: false,
        battery_level: false,
        temperature: false,
        humidity: false,
        air_quality: false,
        odour_detection: false
      });
    } else if (isOpen && !existingBin) {
      // Reset form for new bin
      setFormData({
        name: '',
        location: '',
        deviceId: '',
        capacity: 100,
        binHeight: 100,
        bin_type: 'general_waste',
        description: '',
        status: 'active'
      });
      setSensorsEnabled({
        fill_level: false,
        battery_level: false,
        temperature: false,
        humidity: false,
        air_quality: false,
        odour_detection: false
      });
      setStep(1);
    }
  }, [isOpen, existingBin]);

  // Load available IoT devices
  useEffect(() => {
    if (isOpen) {
      loadAvailableDevices();
    }
  }, [isOpen]);

  // Get live sensor data when device is selected
  useEffect(() => {
    if (formData.deviceId) {
      loadDeviceSensorData(formData.deviceId);
    }
  }, [formData.deviceId]);

  const loadAvailableDevices = async () => {
    try {
      setLoadingDevices(true);
      
      // Get current user and their App ID
      const currentUser = await User.me();
      console.log('📍 Current user:', currentUser);
      
      // Check if admin is impersonating another user
      const impersonatedUserStr = localStorage.getItem('impersonatedUser');
      const effectiveUser = impersonatedUserStr ? JSON.parse(impersonatedUserStr) : currentUser;
      
      // Get user's Application ID - use 'sortyx-iot' as default if not found
      const appId = effectiveUser.applicationId || effectiveUser.app_id || effectiveUser.appId || 'sortyx-iot';
      console.log('🔍 Using Application ID for device filtering:', appId);
      setUserAppId(appId);
      
      // Load devices filtered by Application ID from Firestore
      console.log('📡 Querying Firestore iot-devices collection with applicationId:', appId);
      const devices = await FirebaseService.getAvailableDevices(appId);
      console.log('📦 Available devices returned:', devices);

      if (!devices || devices.length === 0) {
        console.warn('⚠️ No IoT devices found for Application ID:', appId);
        console.warn('💡 Please ensure:');
        console.warn('   1. Firestore has an "iot-devices" collection');
        console.warn('   2. Documents in that collection have an "applicationId" field set to:', appId);
        console.warn('   3. Documents have a "deviceId" field with the device identifier');
        setAvailableDevices([]);
        setLoadingDevices(false);
        return;
      }

      console.log('✅ Found', devices.length, 'devices for Application ID:', appId);

      // Get latest sensor data for each device
      for (const device of devices) {
        try {
          const latestData = await FirebaseService.getLatestSensorData(device.deviceId);
          if (latestData) {
            device.sampleData = latestData;
            device.status = 'online';
            console.log('✅ Device', device.deviceId, 'is online with data');
          } else {
            device.status = 'offline';
            console.log('⚠️ Device', device.deviceId, 'has no sensor data (offline)');
          }
        } catch (error) {
          console.log(`⚠️ No data found for device ${device.deviceId}:`, error.message);
          device.status = 'offline';
        }
      }

      setAvailableDevices(devices || []);
    } catch (error) {
      console.error('❌ Error loading devices:', error);
      setAvailableDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const loadDeviceSensorData = async (deviceId) => {
    try {
      const sensorData = await FirebaseService.getLatestSensorData(deviceId);
      if (sensorData) {
        setSelectedDeviceData(sensorData);
        
        // Auto-enable sensors that have data
        setSensorsEnabled({
          fill_level: sensorData.distance !== undefined,
          battery_level: sensorData.battery !== undefined,
          temperature: sensorData.temperature !== undefined,
          humidity: sensorData.humidity !== undefined,
          air_quality: sensorData.airQuality !== undefined,
          odour_detection: sensorData.odourLevel !== undefined
        });
      }
    } catch (error) {
      console.error('Error loading sensor data:', error);
    }
  };

  const calculateFillLevel = (distance, binHeight) => {
    if (!distance || !binHeight) return 0;
    const fillLevel = ((binHeight - distance) / binHeight) * 100;
    return Math.max(0, Math.min(100, Math.round(fillLevel)));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.deviceId) {
      alert('Please fill in bin name and select a device');
      return;
    }

    setLoading(true);
    try {
      const fillLevel = selectedDeviceData ? calculateFillLevel(selectedDeviceData.distance, formData.binHeight) : existingBin?.current_fill || 0;
      
      const binData = {
        // Basic Details
        name: formData.name,
        location: formData.location,
        deviceId: formData.deviceId,
        device_id: formData.deviceId,
        capacity: formData.capacity,
        binHeight: formData.binHeight,
        bin_type: formData.bin_type,
        description: formData.description,
        status: formData.status,
        type: binType,
        
        // Sensor Configuration
        sensors_enabled: sensorsEnabled,
        
        // Current Sensor Data
        current_fill: fillLevel,
        fillLevel: fillLevel,
        battery_level: selectedDeviceData?.battery || existingBin?.battery_level || 0,
        battery: selectedDeviceData?.battery || existingBin?.battery || 0,
        distance: selectedDeviceData?.distance || existingBin?.distance || 0,
        temperature: selectedDeviceData?.temperature || existingBin?.temperature || 0,
        humidity: selectedDeviceData?.humidity || existingBin?.humidity || 0,
        air_quality: selectedDeviceData?.airQuality || existingBin?.air_quality || 0,
        odour_level: selectedDeviceData?.odourLevel || existingBin?.odour_level || 0,
        
        current_sensor_data: selectedDeviceData || existingBin?.current_sensor_data || {},
        last_sensor_update: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        
        // Thresholds
        fill_threshold: existingBin?.fill_threshold || 80,
        battery_threshold: existingBin?.battery_threshold || 20,
        temp_threshold: existingBin?.temp_threshold || 50,
        
        // Metadata
        ...(existingBin ? {
          id: existingBin.id,
          created_date: existingBin.created_date,
          created_by: existingBin.created_by,
          updated_date: new Date().toISOString()
        } : {
          created_date: new Date().toISOString(),
          created_by: 'admin@sortyx.com'
        })
      };

      await onAddBin(binData);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        deviceId: '',
        capacity: 100,
        binHeight: 100,
        bin_type: 'general_waste',
        description: '',
        status: 'active'
      });
      setSensorsEnabled({
        fill_level: false,
        battery_level: false,
        temperature: false,
        humidity: false,
        air_quality: false,
        odour_detection: false
      });
      setSelectedDeviceData(null);
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Error saving bin:', error);
      alert('Failed to save bin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sensorOptions = [
    {
      id: 'fill_level',
      name: 'Fill Level Sensor',
      description: 'Ultrasonic/ToF sensor for fill monitoring',
      icon: BarChart3,
      dataKey: 'distance'
    },
    {
      id: 'battery_level',
      name: 'Battery Level Sensor',
      description: 'IoT device battery monitoring',
      icon: Battery,
      dataKey: 'battery'
    },
    {
      id: 'temperature',
      name: 'Temperature Sensor',
      description: 'Fire/combustion detection',
      icon: Thermometer,
      dataKey: 'temperature'
    },
    {
      id: 'humidity',
      name: 'Humidity Sensor',
      description: 'Environmental humidity monitoring',
      icon: Droplets,
      dataKey: 'humidity'
    },
    {
      id: 'air_quality',
      name: 'Air Quality Sensor',
      description: 'VOC and gas detection',
      icon: Wind,
      dataKey: 'airQuality'
    },
    {
      id: 'odour_detection',
      name: 'Odour Detection Sensor',
      description: 'Gas sensor for odour level detection',
      icon: Scan,
      dataKey: 'odourLevel'
    }
  ];

  const toggleSensor = (sensorId) => {
    setSensorsEnabled(prev => ({
      ...prev,
      [sensorId]: !prev[sensorId]
    }));
  };

  const isSensorAvailable = (sensor) => {
    if (!selectedDeviceData) return false;
    return selectedDeviceData[sensor.dataKey] !== undefined;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {existingBin ? 'Edit' : 'Add'} {binType === 'single' ? 'Single Bin' : 'Smart Bin'}
              </h2>
              <p className="text-purple-100 text-sm">
                {step === 1 ? 'Step 1: Basic Details' : 'Step 2: Sensor Configuration'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bin Name */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                      Bin Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Main Entrance Bin"
                      className="w-full placeholder:text-gray-900 dark:placeholder:text-[#FFFF00]"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium mb-2 block">
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Building A - Floor 1"
                      className="w-full placeholder:text-gray-900 dark:placeholder:text-[#FFFF00]"
                    />
                  </div>

                  {/* IoT Device */}
                  <div>
                    <Label htmlFor="deviceId" className="text-sm font-medium mb-2 block">
                      IoT Device <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.deviceId}
                      onValueChange={(value) => setFormData({ ...formData, deviceId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select IoT Device"  />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDevices.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            <div className="flex items-center gap-2">
                              <Wifi className="w-4 h-4 text-green-500" />
                              {device.deviceId}
                              <Badge variant="outline" className="ml-2">
                                {device.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bin Type */}
                  <div>
                    <Label htmlFor="bin_type" className="text-sm font-medium mb-2 block">
                      Bin Type
                    </Label>
                    <Select
                      value={formData.bin_type}
                      onValueChange={(value) => setFormData({ ...formData, bin_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general_waste">General Waste</SelectItem>
                        <SelectItem value="recyclable">Recyclable</SelectItem>
                        <SelectItem value="organic">Organic</SelectItem>
                        <SelectItem value="hazardous">Hazardous</SelectItem>
                        <SelectItem value="compost">Compost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Capacity */}
                  <div>
                    <Label htmlFor="capacity" className="text-sm font-medium mb-2 block">
                      Capacity (Liters)
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      placeholder="100"
                      className="w-full"
                    />
                  </div>

                  {/* Bin Height */}
                  <div>
                    <Label htmlFor="binHeight" className="text-sm font-medium mb-2 block">
                      Bin Height (cm)
                    </Label>
                    <Input
                      id="binHeight"
                      type="number"
                      value={formData.binHeight}
                      onChange={(e) => setFormData({ ...formData, binHeight: parseInt(e.target.value) })}
                      placeholder="100"
                      className="w-full"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Select which sensors are enabled for this {binType === 'single' ? 'SingleBin' : 'SmartBin'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sensorOptions.map((sensor) => {
                    const isAvailable = isSensorAvailable(sensor);
                    const isEnabled = sensorsEnabled[sensor.id];
                    const SensorIcon = sensor.icon;

                    return (
                      <motion.div
                        key={sensor.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => isAvailable && toggleSensor(sensor.id)}
                        className={`
                          relative p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isEnabled 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600' 
                            : isAvailable
                            ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <SensorIcon className={`w-5 h-5 mt-1 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {sensor.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {sensor.description}
                            </p>
                          </div>
                          {isEnabled && (
                            <Badge className="bg-green-600 text-white">
                              <Check className="w-3 h-3 mr-1" />
                              ACTIVE
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Live Sensor Data Preview */}
                {selectedDeviceData && (
                  <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Available Sensor Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedDeviceData.fillLevel !== undefined && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fill Level</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {calculateFillLevel(selectedDeviceData.distance, formData.binHeight)}%
                            </p>
                          </div>
                        )}
                        {selectedDeviceData.battery !== undefined && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Battery</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {selectedDeviceData.battery}%
                            </p>
                          </div>
                        )}
                        {selectedDeviceData.distance !== undefined && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Distance</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {selectedDeviceData.distance}cm
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                if (step === 2) {
                  setStep(1);
                } else {
                  onClose();
                }
              }}
              disabled={loading}
            >
              {step === 2 ? 'Back' : 'Cancel'}
            </Button>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full ${
                      s === step ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {step === 1 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.deviceId}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Next: Configure Sensors
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (existingBin ? 'Updating...' : 'Adding...') : (existingBin ? `Update ${binType === 'single' ? 'Single Bin' : 'Smart Bin'}` : `Add ${binType === 'single' ? 'Single Bin' : 'Smart Bin'}`)}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImprovedAddBinModal;
