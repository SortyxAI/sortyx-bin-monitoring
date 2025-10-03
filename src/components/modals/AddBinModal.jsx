import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Wifi, MapPin, Battery, Gauge, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FirebaseService } from '@/services/firebaseService';

const AddBinModal = ({ isOpen, onClose, onAddBin, binType = 'smartbin' }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    deviceId: '',
    capacity: 100,
    binHeight: 100,
    wasteTypes: ['organic', 'plastic', 'paper', 'glass'],
    description: ''
  });
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [realTimePreview, setRealTimePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Fetch available IoT devices from Firebase
  useEffect(() => {
    if (isOpen) {
      loadAvailableDevices();
    }
  }, [isOpen]);

  // Subscribe to real-time data for preview when device is selected
  useEffect(() => {
    if (selectedDevice && selectedDevice.deviceId) {
      console.log(`🔔 Setting up real-time preview for: ${selectedDevice.deviceId}`);
      
      const unsubscribe = FirebaseService.subscribeToSensorData(
        selectedDevice.deviceId,
        (sensorData) => {
          console.log(`📡 Preview data received for ${selectedDevice.deviceId}:`, sensorData);
          if (sensorData) {
            setRealTimePreview(sensorData);
          }
        },
        (error) => {
          console.error(`❌ Preview subscription error for ${selectedDevice.deviceId}:`, error);
        }
      );

      return () => {
        if (unsubscribe) {
          console.log(`🔇 Unsubscribing from preview for: ${selectedDevice.deviceId}`);
          unsubscribe();
        }
      };
    } else {
      setRealTimePreview(null);
    }
  }, [selectedDevice]);

  const loadAvailableDevices = async () => {
    try {
      setLoadingDevices(true);
      // Mock available devices based on your Firebase structure
      const devices = [
        {
          deviceId: 'sortyx-sensor-two',
          applicationId: 'sortyx-iot',
          collection: 'sensor-data-sortyx-sensor-two',
          lastSeen: new Date().toISOString(),
          status: 'online'
        },
        {
          deviceId: 'plaese-work',
          applicationId: 'sortyx-iot',
          collection: 'sensor-data-plaese-work',
          lastSeen: new Date().toISOString(),
          status: 'online'
        },
        {
          deviceId: 'sortyx-sensor-one',
          applicationId: 'sortyx-iot', 
          collection: 'sensor-data-sortyx-sensor-one',
          lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'online'
        }
      ];

      // Try to get actual latest data for each device
      for (const device of devices) {
        try {
          const latestData = await FirebaseService.getLatestSensorData(device.deviceId);
          if (latestData) {
            device.sampleData = latestData;
          }
        } catch (error) {
          console.log(`No data found for device ${device.deviceId}`);
        }
      }

      setAvailableDevices(devices);
    } catch (error) {
      console.error('Error loading available devices:', error);
      // Set default devices even if Firebase fails
      setAvailableDevices([
        {
          deviceId: 'sortyx-sensor-two',
          applicationId: 'sortyx-iot',
          collection: 'sensor-data-sortyx-sensor-two',
          lastSeen: new Date().toISOString(),
          status: 'online'
        }
      ]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeviceSelect = async (device) => {
    setSelectedDevice(device);
    setLoadingDevices(true);
    
    try {
      // Get the latest sensor data for this device
      const latestSensorData = await FirebaseService.getLatestSensorData(device.deviceId);
      
      console.log(`📊 Auto-filling form with data from ${device.deviceId}:`, latestSensorData);
      
      // Auto-fill form based on device and sensor data
      const deviceFriendlyNames = {
        'sortyx-sensor-two': 'Main Entrance Smart Bin',
        'plaese-work': 'Cafeteria Smart Bin',
        'sortyx-sensor-one': 'Office Smart Bin'
      };
      
      const deviceLocations = {
        'sortyx-sensor-two': 'Building A - Main Entrance',
        'plaese-work': 'Building B - Cafeteria Area',
        'sortyx-sensor-one': 'Building C - Office Floor'
      };
      
      // Calculate current fill level if sensor data is available
      let currentFillLevel = 0;
      let estimatedCapacity = 100;
      
      if (latestSensorData && latestSensorData.distance) {
        const binHeight = 100; // Default bin height in cm
        currentFillLevel = calculateFillLevel(latestSensorData.distance, binHeight);
        
        // Smart capacity estimation based on current usage
        if (currentFillLevel > 80) {
          estimatedCapacity = 150; // Larger bin needed
        } else if (currentFillLevel < 20) {
          estimatedCapacity = 75; // Smaller bin sufficient
        }
      }
      
      setFormData(prev => ({
        ...prev,
        deviceId: device.deviceId,
        name: deviceFriendlyNames[device.deviceId] || `Smart Bin - ${device.deviceId}`,
        location: deviceLocations[device.deviceId] || 'IoT Network Location',
        capacity: estimatedCapacity,
        binHeight: 100,
        description: latestSensorData ? 
          `Connected IoT device with live sensor monitoring. Current status: Battery ${latestSensorData.battery}%, Fill Level ${latestSensorData.fillLevel}%, Distance ${latestSensorData.distance}cm` : 
          `IoT-enabled smart bin with sensor monitoring capabilities`,
        // Auto-select waste types based on location
        wasteTypes: device.deviceId === 'plaese-work' ? 
          ['organic', 'plastic', 'paper'] : // Cafeteria focuses on organic waste
          ['plastic', 'paper', 'glass', 'general'] // General areas
      }));
      
      // Also update real-time preview
      if (latestSensorData) {
        setRealTimePreview(latestSensorData);
      }
      
    } catch (error) {
      console.error('Error auto-filling device data:', error);
      // Fallback to basic auto-fill
      setFormData(prev => ({
        ...prev,
        deviceId: device.deviceId,
        name: `Smart Bin - ${device.deviceId}`,
        location: 'IoT Network Location',
        capacity: 100
      }));
    }
    
    setLoadingDevices(false);
  };

  const calculateFillLevel = (distance, binHeight) => {
    if (!distance || !binHeight || isNaN(distance) || isNaN(binHeight)) return 0;
    const fillLevel = ((binHeight - distance) / binHeight) * 100;
    if (isNaN(fillLevel)) return 0;
    return Math.max(0, Math.min(100, Math.round(fillLevel)));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.deviceId) {
      alert('Please fill in all required fields and select a device');
      return;
    }

    setLoading(true);
    try {
      const newBin = {
        id: `bin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        location: formData.location,
        deviceId: formData.deviceId,
        capacity: formData.capacity,
        binHeight: formData.binHeight,
        wasteTypes: binType === 'smartbin' ? formData.wasteTypes : ['mixed'],
        description: formData.description,
        type: binType,
        status: 'active',
        created_date: new Date().toISOString(),
        created_by: 'admin@sortyx.com',
        // IoT Configuration
        iotConfig: {
          applicationId: selectedDevice?.applicationId,
          collection: selectedDevice?.collection,
          autoCalculateFill: true,
          alertThresholds: {
            fillLevel: 80,
            battery: 20,
            tilt: ['tilted', 'fallen']
          }
        }
      };

      await onAddBin(newBin);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        deviceId: '',
        capacity: 100,
        binHeight: 100,
        wasteTypes: ['organic', 'plastic', 'paper', 'glass'],
        description: ''
      });
      setSelectedDevice(null);
      setRealTimePreview(null);
      onClose();
    } catch (error) {
      console.error('Error adding bin:', error);
      alert('Failed to add bin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-[#2A1F3D] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-purple-200 dark:border-purple-600"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-200 dark:border-purple-600 bg-gradient-to-r from-purple-600 to-indigo-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Add New {binType === 'smartbin' ? 'SmartBin' : 'SingleBin'}
                </h2>
                <p className="text-purple-100 text-sm">Connect to your IoT sensor data</p>
              </div>
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

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <Card className="border-purple-200 dark:border-purple-600">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-purple-100">Bin Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-purple-200">Bin Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Office Building Bin A"
                        className="w-full p-3 border border-purple-200 dark:border-purple-600 rounded-lg dark:bg-[#1F0F2E] dark:text-purple-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-purple-200">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Main Lobby, Floor 2"
                        className="w-full p-3 border border-purple-200 dark:border-purple-600 rounded-lg dark:bg-[#1F0F2E] dark:text-purple-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-purple-200">Capacity (L)</label>
                        <input
                          type="number"
                          value={formData.capacity || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            handleInputChange('capacity', value);
                          }}
                          min="1"
                          className="w-full p-3 border border-purple-200 dark:border-purple-600 rounded-lg dark:bg-[#1F0F2E] dark:text-purple-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-purple-200">Bin Height (cm)</label>
                        <input
                          type="number"
                          value={formData.binHeight || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            handleInputChange('binHeight', value);
                          }}
                          min="1"
                          className="w-full p-3 border border-purple-200 dark:border-purple-600 rounded-lg dark:bg-[#1F0F2E] dark:text-purple-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>

                    {binType === 'smartbin' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-purple-200">Waste Types</label>
                        <div className="flex flex-wrap gap-2">
                          {['organic', 'plastic', 'paper', 'glass', 'metal', 'electronic'].map((type) => (
                            <Badge
                              key={type}
                              variant={formData.wasteTypes.includes(type) ? "default" : "outline"}
                              className={`cursor-pointer ${
                                formData.wasteTypes.includes(type) 
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                  : 'border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                              }`}
                              onClick={() => {
                                const newTypes = formData.wasteTypes.includes(type)
                                  ? formData.wasteTypes.filter(t => t !== type)
                                  : [...formData.wasteTypes, type];
                                handleInputChange('wasteTypes', newTypes);
                              }}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-purple-200">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Optional description..."
                        rows={3}
                        className="w-full p-3 border border-purple-200 dark:border-purple-600 rounded-lg dark:bg-[#1F0F2E] dark:text-purple-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - IoT Device Selection */}
              <div className="space-y-6">
                <Card className="border-purple-200 dark:border-purple-600">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-purple-100">
                      <Wifi className="w-5 h-5 text-purple-600" />
                      IoT Device Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingDevices ? (
                      <div className="text-center py-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <p className="text-gray-500 dark:text-purple-200">Loading devices...</p>
                      </div>
                    ) : availableDevices.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-purple-200 mb-2">No IoT devices found</p>
                        <p className="text-xs text-gray-400 dark:text-purple-300 mb-4">Make sure your Firebase database has sensor data</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadAvailableDevices}
                          className="border-purple-300 dark:border-purple-600"
                        >
                          Refresh
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableDevices.map((device) => (
                          <div
                            key={device.deviceId}
                            onClick={() => handleDeviceSelect(device)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedDevice?.deviceId === device.deviceId
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-purple-200 dark:border-purple-600 hover:border-purple-300 dark:hover:border-purple-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium dark:text-purple-100 flex items-center gap-2">
                                  <Wifi className="w-4 h-4" />
                                  {device.deviceId}
                                  {selectedDevice?.deviceId === device.deviceId && (
                                    <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900">
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-purple-300">{device.applicationId}</div>
                              </div>
                              <Badge 
                                variant={device.status === 'online' ? 'default' : 'secondary'}
                                className={device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                              >
                                {device.status}
                              </Badge>
                            </div>
                            
                            {/* Real-time sensor data preview */}
                            {device.sampleData && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-purple-800/20 rounded-lg">
                                <div className="text-xs text-gray-600 dark:text-purple-300 mb-2 font-medium">Live Sensor Data:</div>
                                <div className="grid grid-cols-3 gap-3 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Battery className="w-3 h-3 text-green-600" />
                                    <span className="text-gray-700 dark:text-purple-200">
                                      {device.sampleData.battery}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Gauge className="w-3 h-3 text-blue-600" />
                                    <span className="text-gray-700 dark:text-purple-200">
                                      {device.sampleData.distance}cm
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-orange-600" />
                                    <span className="text-gray-700 dark:text-purple-200">
                                      {device.sampleData.fillLevel}% full
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-purple-400 mt-2">
                                  Updated: {new Date(device.sampleData.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400 dark:text-purple-400 mt-2">
                              Last seen: {new Date(device.lastSeen).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Real-time Preview */}
                {realTimePreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-800 dark:text-green-300 flex items-center gap-2">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-3 h-3 bg-green-500 rounded-full"
                          />
                          Live Sensor Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Gauge className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600 dark:text-green-200">Distance</span>
                            </div>
                            <div className="text-xl font-bold text-green-800 dark:text-green-200">{realTimePreview.distance} cm</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Trash2 className="w-4 h-4 text-purple-600" />
                              <span className="text-sm text-gray-600 dark:text-green-200">Fill Level</span>
                            </div>
                            <div className="text-xl font-bold text-green-800 dark:text-green-200">
                              {calculateFillLevel(realTimePreview.distance, formData.binHeight)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Battery className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-600 dark:text-green-200">Battery</span>
                            </div>
                            <div className="text-xl font-bold text-green-800 dark:text-green-200">{realTimePreview.battery}%</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <MapPin className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-gray-600 dark:text-green-200">Status</span>
                            </div>
                            <div className="text-lg font-medium capitalize text-green-800 dark:text-green-200">{realTimePreview.tilt}</div>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 dark:text-green-300">
                          Last update: {new Date(realTimePreview.timestamp).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Bin Preview Section */}
                {selectedDevice && formData.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <Trash2 className="w-5 h-5" />
                          Bin Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium dark:text-blue-200">Name:</span>
                            <span className="text-blue-800 dark:text-blue-300">{formData.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium dark:text-blue-200">Location:</span>
                            <span className="text-blue-800 dark:text-blue-300">{formData.location}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium dark:text-blue-200">IoT Device:</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              {formData.deviceId}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium dark:text-blue-200">Capacity:</span>
                            <span className="text-blue-800 dark:text-blue-300">{formData.capacity}L</span>
                          </div>
                          {formData.wasteTypes && formData.wasteTypes.length > 0 && (
                            <div>
                              <span className="font-medium dark:text-blue-200 block mb-2">Waste Types:</span>
                              <div className="flex flex-wrap gap-1">
                                {formData.wasteTypes.map((type) => (
                                  <Badge key={type} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {realTimePreview && (
                            <div className="border-t pt-3 mt-3">
                              <span className="font-medium dark:text-blue-200 block mb-2">Current Status:</span>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="text-center p-2 bg-white dark:bg-blue-800/20 rounded">
                                  <div className="text-xs text-gray-600 dark:text-blue-300">Fill Level</div>
                                  <div className="font-bold text-blue-800 dark:text-blue-200">
                                    {realTimePreview.fillLevel}%
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-white dark:bg-blue-800/20 rounded">
                                  <div className="text-xs text-gray-600 dark:text-blue-300">Battery</div>
                                  <div className="font-bold text-blue-800 dark:text-blue-200">
                                    {realTimePreview.battery}%
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-white dark:bg-blue-800/20 rounded">
                                  <div className="text-xs text-gray-600 dark:text-blue-300">Distance</div>
                                  <div className="font-bold text-blue-800 dark:text-blue-200">
                                    {realTimePreview.distance}cm
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-purple-200 dark:border-purple-600">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.deviceId}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {loading ? 'Adding...' : `Add ${binType === 'smartbin' ? 'SmartBin' : 'SingleBin'}`}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddBinModal;