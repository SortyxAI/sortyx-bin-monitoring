import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi, Check, Plus, Trash2, Package, BarChart3, Battery, Thermometer, Droplets, Wind, Scan } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FirebaseService } from '@/services/firebaseService';
import { SmartBin, Compartment, User } from '@/api/entities';

const MultiCompartmentSmartBinModal = ({ isOpen, onClose, onSave, existingBin = null }) => {
  const [step, setStep] = useState(1);
  
  // Step 1: SmartBin Details (No IoT Device here)
  const [smartBinData, setSmartBinData] = useState({
    name: '',
    location: '',
    description: '',
    status: 'active'
  });

  // Step 2: Compartments
  const [compartments, setCompartments] = useState([]);
  const [editingCompartmentIndex, setEditingCompartmentIndex] = useState(null);
  const [compartmentForm, setCompartmentForm] = useState({
    name: '',
    compartment_id: '',
    deviceId: '',
    bin_type: 'general_waste',
    capacity: 100,
    binHeight: 100,
    fill_threshold: 80,
    status: 'active',
    description: ''
  });

  // SmartBin Level Sensors (ONLY Temperature, Humidity, Air Quality)
  const [smartBinSensors, setSmartBinSensors] = useState({
    temperature: false,
    humidity: false,
    air_quality: false
  });

  // Compartment Level Sensors (Fill Level and Battery are KEY sensors)
  const [compartmentSensors, setCompartmentSensors] = useState({
    fill_level: true,  // Default enabled as KEY sensor
    battery_level: true,  // Default enabled as KEY sensor
    odour_detection: false,
    lid_sensor: false
  });

  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceData, setSelectedDeviceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Load existing bin data when modal opens in edit mode
  useEffect(() => {
    if (isOpen && existingBin) {
      setSmartBinData({
        name: existingBin.name || '',
        location: existingBin.location || '',
        description: existingBin.description || '',
        status: existingBin.status || 'active'
      });
      setSmartBinSensors(existingBin.sensors_enabled || {
        temperature: false,
        humidity: false,
        air_quality: false
      });
      // Load existing compartments if any
      if (existingBin.compartments && existingBin.compartments.length > 0) {
        setCompartments(existingBin.compartments);
      }
    } else if (isOpen && !existingBin) {
      resetForm();
    }
  }, [isOpen, existingBin]);

  // Load available IoT devices
  useEffect(() => {
    if (isOpen) {
      loadAvailableDevices();
    }
  }, [isOpen]);

  // Get live sensor data when device is selected for compartment
  useEffect(() => {
    if (compartmentForm.deviceId) {
      loadDeviceSensorData(compartmentForm.deviceId);
    }
  }, [compartmentForm.deviceId]);

  const resetForm = () => {
    setSmartBinData({
      name: '',
      location: '',
      description: '',
      status: 'active'
    });
    setCompartments([]);
    setCompartmentForm({
      name: '',
      compartment_id: '',
      deviceId: '',
      bin_type: 'general_waste',
      capacity: 100,
      binHeight: 100,
      fill_threshold: 80,
      status: 'active',
      description: ''
    });
    setSmartBinSensors({
      temperature: false,
      humidity: false,
      air_quality: false
    });
    setCompartmentSensors({
      fill_level: true,
      battery_level: true,
      odour_detection: false,
      lid_sensor: false
    });
    setSelectedDeviceData(null);
    setEditingCompartmentIndex(null);
    setStep(1);
  };

  const loadAvailableDevices = async () => {
    try {
      setLoadingDevices(true);
      const currentUser = await User.me();
      const impersonatedUserStr = localStorage.getItem('impersonatedUser');
      const effectiveUser = impersonatedUserStr ? JSON.parse(impersonatedUserStr) : currentUser;
      const appId = effectiveUser.applicationId || effectiveUser.app_id || effectiveUser.appId || 'sortyx-iot';
      
      const devices = await FirebaseService.getAvailableDevices(appId);
      
      // Get latest sensor data for each device
      for (const device of devices) {
        try {
          const latestData = await FirebaseService.getLatestSensorData(device.deviceId);
          if (latestData) {
            device.sampleData = latestData;
            device.status = 'online';
          } else {
            device.status = 'offline';
          }
        } catch (error) {
          device.status = 'offline';
        }
      }

      setAvailableDevices(devices || []);
    } catch (error) {
      console.error('Error loading devices:', error);
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
      }
    } catch (error) {
      console.error('Error loading sensor data:', error);
    }
  };

  const handleAddCompartment = () => {
    if (!compartmentForm.name || !compartmentForm.compartment_id || !compartmentForm.deviceId) {
      alert('Please fill in compartment name, compartment ID, and select an IoT device');
      return;
    }

    const newCompartment = {
      ...compartmentForm,
      compartment_name: compartmentForm.compartment_id, // Map compartment_id to compartment_name
      sensors_enabled: compartmentSensors,
      current_fill: 0,
      id: editingCompartmentIndex !== null ? compartments[editingCompartmentIndex].id : `temp_${Date.now()}`
    };

    if (editingCompartmentIndex !== null) {
      // Update existing compartment
      const updatedCompartments = [...compartments];
      updatedCompartments[editingCompartmentIndex] = newCompartment;
      setCompartments(updatedCompartments);
      setEditingCompartmentIndex(null);
    } else {
      // Add new compartment
      setCompartments([...compartments, newCompartment]);
    }

    // Reset compartment form
    setCompartmentForm({
      name: '',
      compartment_id: '',
      deviceId: '',
      bin_type: 'general_waste',
      capacity: 100,
      binHeight: 100,
      fill_threshold: 80,
      status: 'active',
      description: ''
    });
    setCompartmentSensors({
      fill_level: true,
      battery_level: true,
      odour_detection: false,
      lid_sensor: false
    });
    setSelectedDeviceData(null);
  };

  const handleEditCompartment = (index) => {
    const comp = compartments[index];
    setCompartmentForm({
      name: comp.name,
      compartment_id: comp.compartment_id || comp.compartment_name,
      deviceId: comp.deviceId || '',
      bin_type: comp.bin_type,
      capacity: comp.capacity,
      binHeight: comp.binHeight,
      fill_threshold: comp.fill_threshold,
      status: comp.status || 'active',
      description: comp.description || ''
    });
    setCompartmentSensors(comp.sensors_enabled || {
      fill_level: true,
      battery_level: true,
      odour_detection: false,
      lid_sensor: false
    });
    setEditingCompartmentIndex(index);
  };

  const handleDeleteCompartment = (index) => {
    const updatedCompartments = compartments.filter((_, i) => i !== index);
    setCompartments(updatedCompartments);
    if (editingCompartmentIndex === index) {
      setEditingCompartmentIndex(null);
      setCompartmentForm({
        name: '',
        compartment_id: '',
        deviceId: '',
        bin_type: 'general_waste',
        capacity: 100,
        binHeight: 100,
        fill_threshold: 80,
        status: 'active',
        description: ''
      });
    }
  };

  const handleSubmit = async () => {
    if (!smartBinData.name) {
      alert('Please fill in SmartBin name');
      return;
    }

    if (compartments.length === 0) {
      alert('Please add at least one compartment');
      return;
    }

    setLoading(true);
    try {
      // Create SmartBin payload with compartments included
      const smartBinPayload = {
        name: smartBinData.name,
        location: smartBinData.location,
        description: smartBinData.description,
        status: smartBinData.status,
        type: 'smartbin',
        sensors_enabled: smartBinSensors,
        
        // SmartBin level sensor data (from first compartment's device or defaults)
        temperature: 0,
        humidity: 0,
        air_quality: 0,
        
        current_sensor_data: {},
        last_sensor_update: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        
        // Thresholds
        temp_threshold: 50,
        
        // Include compartments in the SmartBin payload
        compartments: compartments,
        
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

      // Call onSave with the complete payload
      await onSave(smartBinPayload);
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving SmartBin:', error);
      alert('Failed to save SmartBin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const smartBinSensorOptions = [
    { id: 'temperature', name: 'Temperature Sensor', icon: Thermometer, description: 'Monitor ambient temperature' },
    { id: 'humidity', name: 'Humidity Sensor', icon: Droplets, description: 'Monitor ambient humidity' },
    { id: 'air_quality', name: 'Air Quality Sensor', icon: Wind, description: 'Monitor air quality index' }
  ];

  const compartmentSensorOptions = [
    { id: 'fill_level', name: 'Fill Level Sensor', icon: BarChart3, description: 'Ultrasonic/ToF sensor (KEY)', isKey: true },
    { id: 'battery_level', name: 'Battery Level', icon: Battery, description: 'Battery monitoring (KEY)', isKey: true },
    { id: 'odour_detection', name: 'Odour Sensor', icon: Scan, description: 'Gas sensor for odour detection' },
    { id: 'lid_sensor', name: 'Lid Open Sensor', icon: Package, description: 'Lid open/close detection' }
  ];

  const binTypeColors = {
    recyclable: 'bg-blue-500',
    general_waste: 'bg-gray-500',
    compost: 'bg-green-500',
    organic: 'bg-emerald-500',
    hazardous: 'bg-red-500'
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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {existingBin ? 'Edit' : 'Add'} Multi-Compartment SmartBin
              </h2>
              <p className="text-purple-100 text-sm">
                {step === 1 ? 'Step 1: SmartBin Details & Sensors' : 'Step 2: Add Compartments'}
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
                {/* SmartBin Basic Details */}
                <Card className="border-2 border-purple-200 dark:border-purple-700">
                  <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
                    <CardTitle className="text-lg">SmartBin Basic Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">SmartBin Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="name"
                          value={smartBinData.name}
                          onChange={(e) => setSmartBinData({ ...smartBinData, name: e.target.value })}
                          placeholder="e.g., Main Hall SmartBin"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={smartBinData.location}
                          onChange={(e) => setSmartBinData({ ...smartBinData, location: e.target.value })}
                          placeholder="e.g., Building A - Floor 1"
                          className="mt-2"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={smartBinData.description}
                          onChange={(e) => setSmartBinData({ ...smartBinData, description: e.target.value })}
                          placeholder="Optional description..."
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SmartBin Level Sensors */}
                <Card className="border-2 border-indigo-200 dark:border-indigo-700">
                  <CardHeader className="bg-indigo-50 dark:bg-indigo-900/20">
                    <CardTitle className="text-lg">SmartBin Common Sensors</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">These sensors monitor the entire SmartBin</p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {smartBinSensorOptions.map((sensor) => {
                        const isEnabled = smartBinSensors[sensor.id];
                        const SensorIcon = sensor.icon;

                        return (
                          <motion.div
                            key={sensor.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSmartBinSensors({ ...smartBinSensors, [sensor.id]: !isEnabled })}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isEnabled
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                : 'bg-white dark:bg-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <SensorIcon className={`w-5 h-5 mt-1 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{sensor.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{sensor.description}</p>
                              </div>
                              {isEnabled && (
                                <Badge className="bg-green-600 text-white">
                                  <Check className="w-3 h-3 mr-1" />
                                  ON
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Compartment Form */}
                <Card className="border-2 border-blue-200 dark:border-blue-700">
                  <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                    <CardTitle className="text-lg">
                      {editingCompartmentIndex !== null ? 'Edit' : 'Add'} Compartment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Compartment Name <span className="text-red-500">*</span></Label>
                        <Input
                          value={compartmentForm.name}
                          onChange={(e) => setCompartmentForm({ ...compartmentForm, name: e.target.value })}
                          placeholder="e.g., Front Compartment"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Compartment ID <span className="text-red-500">*</span></Label>
                        <Input
                          value={compartmentForm.compartment_id}
                          onChange={(e) => setCompartmentForm({ ...compartmentForm, compartment_id: e.target.value })}
                          placeholder="e.g., COMP-A"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>IoT Device <span className="text-red-500">*</span></Label>
                        <Select
                          value={compartmentForm.deviceId}
                          onValueChange={(value) => setCompartmentForm({ ...compartmentForm, deviceId: value })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select IoT Device" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDevices.map((device) => (
                              <SelectItem key={device.deviceId} value={device.deviceId}>
                                <div className="flex items-center gap-2">
                                  <Wifi className="w-4 h-4 text-green-500" />
                                  {device.deviceId}
                                  <Badge variant="outline">{device.status}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Waste Type</Label>
                        <Select
                          value={compartmentForm.bin_type}
                          onValueChange={(value) => setCompartmentForm({ ...compartmentForm, bin_type: value })}
                        >
                          <SelectTrigger className="mt-2">
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

                      <div>
                        <Label>Capacity (Liters)</Label>
                        <Input
                          type="number"
                          value={compartmentForm.capacity}
                          onChange={(e) => setCompartmentForm({ ...compartmentForm, capacity: parseInt(e.target.value) })}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          value={compartmentForm.binHeight}
                          onChange={(e) => setCompartmentForm({ ...compartmentForm, binHeight: parseInt(e.target.value) })}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Fill Alert Threshold (%)</Label>
                        <Input
                          type="number"
                          value={compartmentForm.fill_threshold}
                          onChange={(e) => setCompartmentForm({ ...compartmentForm, fill_threshold: parseInt(e.target.value) })}
                          className="mt-2"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={compartmentForm.description}
                          onChange={(e) => setCompartmentForm({ ...compartmentForm, description: e.target.value })}
                          placeholder="Optional description..."
                          rows={2}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* Compartment Sensors */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Compartment Sensors</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {compartmentSensorOptions.map((sensor) => {
                          const isEnabled = compartmentSensors[sensor.id];
                          const SensorIcon = sensor.icon;

                          return (
                            <motion.div
                              key={sensor.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setCompartmentSensors({ ...compartmentSensors, [sensor.id]: !isEnabled })}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isEnabled
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                  : 'bg-white dark:bg-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <SensorIcon className={`w-4 h-4 mt-1 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{sensor.name}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{sensor.description}</p>
                                </div>
                                {isEnabled && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    <Check className="w-2 h-2 mr-1" />
                                  </Badge>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      onClick={handleAddCompartment}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {editingCompartmentIndex !== null ? 'Update Compartment' : 'Add Compartment'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Added Compartments List */}
                {compartments.length > 0 && (
                  <Card className="border-2 border-green-200 dark:border-green-700">
                    <CardHeader className="bg-green-50 dark:bg-green-900/20">
                      <CardTitle className="text-lg">Added Compartments ({compartments.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {compartments.map((comp, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600"
                          >
                            <div className={`w-3 h-3 rounded-full ${binTypeColors[comp.bin_type]}`} />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{comp.name}</h4>
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <Badge variant="outline" className="text-xs">{comp.compartment_name}</Badge>
                                <span>•</span>
                                <span>{comp.bin_type.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{comp.capacity}L</span>
                                <span>•</span>
                                <span>{comp.binHeight}cm</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCompartment(index)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCompartment(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
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
                  disabled={!smartBinData.name}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Next: Add Compartments
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || compartments.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Saving...' : `${existingBin ? 'Update' : 'Create'} SmartBin with ${compartments.length} Compartment${compartments.length !== 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MultiCompartmentSmartBinModal;
