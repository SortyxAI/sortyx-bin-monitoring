import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit, Trash2, Check, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FirebaseService } from '@/services/firebaseService';

const CompartmentManagementModal = ({ isOpen, onClose, smartBin, onSave, initialCompartment = null }) => {
  const [mode, setMode] = useState('list'); // 'list', 'add', 'edit'
  const [editingCompartment, setEditingCompartment] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [compartments, setCompartments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    label: '',
    deviceId: '',
    capacity: 50,
    binHeight: 50,
    compartment_type: 'general_waste',
    fill_threshold: 80,
    battery_threshold: 20
  });

  const [sensorsEnabled, setSensorsEnabled] = useState({
    fill_level: true,
    battery_level: true,
    temperature: false,
    humidity: false,
    air_quality: false,
    odour_detection: false
  });

  useEffect(() => {
    if (isOpen && smartBin) {
      loadAvailableDevices();
      loadCompartments();
      
      // If an initial compartment is provided, switch to edit mode
      if (initialCompartment) {
        handleEditCompartment(initialCompartment);
      } else {
        setMode('list');
      }
    }
  }, [isOpen, smartBin, initialCompartment]);

  const loadAvailableDevices = async () => {
    try {
      const devices = await FirebaseService.getAvailableDevices();
      setAvailableDevices(devices || []);
    } catch (error) {
      console.error('Error loading devices:', error);
      setAvailableDevices([]);
    }
  };

  const loadCompartments = async () => {
    try {
      const allCompartments = await FirebaseService.getCompartments();
      setCompartments(allCompartments || []);
    } catch (error) {
      console.error('Error loading compartments:', error);
      setCompartments([]);
    }
  };

  const binCompartments = (compartments || []).filter(c => 
    c.smartBinId === smartBin?.id || c.smartbin_id === smartBin?.id
  );

  const handleAddCompartment = () => {
    setMode('add');
    setEditingCompartment(null);
    setFormData({
      label: '',
      deviceId: '',
      capacity: 50,
      binHeight: 50,
      compartment_type: 'general_waste',
      fill_threshold: 80,
      battery_threshold: 20
    });
    setSensorsEnabled({
      fill_level: true,
      battery_level: true,
      temperature: false,
      humidity: false,
      air_quality: false,
      odour_detection: false
    });
  };

  const handleEditCompartment = (compartment) => {
    setMode('edit');
    setEditingCompartment(compartment);
    setFormData({
      label: compartment.label || '',
      deviceId: compartment.deviceId || compartment.device_id || '',
      capacity: compartment.capacity || 50,
      binHeight: compartment.binHeight || 50,
      compartment_type: compartment.compartment_type || 'general_waste',
      fill_threshold: compartment.fill_threshold || 80,
      battery_threshold: compartment.battery_threshold || 20
    });
    setSensorsEnabled(compartment.sensors_enabled || {
      fill_level: true,
      battery_level: true,
      temperature: false,
      humidity: false,
      air_quality: false,
      odour_detection: false
    });
  };

  const handleSaveCompartment = async () => {
    if (!formData.label || !formData.deviceId) {
      alert('Please fill in compartment label and select a device');
      return;
    }

    setLoading(true);
    try {
      const compartmentData = {
        ...formData,
        id: editingCompartment?.id,
        smartBinId: smartBin.id,
        smartbin_id: smartBin.id,
        sensors_enabled: sensorsEnabled,
        status: 'active',
        current_fill: 0,
        battery_level: 100,
        device_id: formData.deviceId
      };

      await FirebaseService.saveCompartment(compartmentData);
      alert(`Compartment "${formData.label}" ${editingCompartment ? 'updated' : 'added'} successfully!`);
      
      setMode('list');
      setEditingCompartment(null);
      await loadCompartments();
    } catch (error) {
      console.error('Error saving compartment:', error);
      alert(`Failed to save compartment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompartment = async (compartmentId) => {
    if (window.confirm('Are you sure you want to delete this compartment?')) {
      try {
        await FirebaseService.deleteCompartment(compartmentId);
        alert('Compartment deleted successfully!');
        await loadCompartments();
      } catch (error) {
        console.error('Error deleting compartment:', error);
        alert(`Failed to delete compartment: ${error.message}`);
      }
    }
  };

  const toggleSensor = (sensorId) => {
    setSensorsEnabled(prev => ({
      ...prev,
      [sensorId]: !prev[sensorId]
    }));
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
                Manage Compartments
              </h2>
              <p className="text-purple-100 text-sm">
                {smartBin?.name || 'Smart Bin'}
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
            {mode === 'list' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Compartments ({binCompartments.length})
                  </h3>
                  <Button
                    onClick={handleAddCompartment}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Compartment
                  </Button>
                </div>

                {binCompartments.length === 0 ? (
                  <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No compartments added yet. Click "Add Compartment" to create one.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {binCompartments.map((compartment) => (
                      <Card key={compartment.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {compartment.label}
                                </h4>
                                <Badge variant="outline">
                                  {compartment.compartment_type?.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-1">
                                  <Wifi className="w-3 h-3" />
                                  {compartment.deviceId || compartment.device_id}
                                </div>
                                <div>Capacity: {compartment.capacity}L</div>
                                <div>Height: {compartment.binHeight}cm</div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Object.entries(compartment.sensors_enabled || {}).map(([key, value]) => 
                                  value && (
                                    <Badge key={key} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      {key.replace('_', ' ')}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCompartment(compartment)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCompartment(compartment.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(mode === 'add' || mode === 'edit') && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {mode === 'add' ? 'Add New Compartment' : 'Edit Compartment'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="label" className="text-sm font-medium mb-2 block">
                      Compartment Label <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="e.g., Compartment A"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deviceId" className="text-sm font-medium mb-2 block">
                      IoT Device <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.deviceId}
                      onValueChange={(value) => setFormData({ ...formData, deviceId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select IoT Device" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDevices.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            <div className="flex items-center gap-2">
                              <Wifi className="w-4 h-4 text-green-500" />
                              {device.deviceId}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="compartment_type" className="text-sm font-medium mb-2 block">
                      Compartment Type
                    </Label>
                    <Select
                      value={formData.compartment_type}
                      onValueChange={(value) => setFormData({ ...formData, compartment_type: value })}
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

                  <div>
                    <Label htmlFor="capacity" className="text-sm font-medium mb-2 block">
                      Capacity (Liters)
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="binHeight" className="text-sm font-medium mb-2 block">
                      Height (cm)
                    </Label>
                    <Input
                      id="binHeight"
                      type="number"
                      value={formData.binHeight}
                      onChange={(e) => setFormData({ ...formData, binHeight: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fill_threshold" className="text-sm font-medium mb-2 block">
                      Fill Threshold (%)
                    </Label>
                    <Input
                      id="fill_threshold"
                      type="number"
                      value={formData.fill_threshold}
                      onChange={(e) => setFormData({ ...formData, fill_threshold: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Sensor Configuration */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Enable Sensors
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(sensorsEnabled).map(([key, value]) => (
                      <div
                        key={key}
                        onClick={() => toggleSensor(key)}
                        className={`
                          p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${value 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {value && <Check className="w-4 h-4 text-green-600" />}
                          <span className="text-sm font-medium">
                            {key.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            {mode === 'list' ? (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setMode('list')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveCompartment}
                  disabled={loading || !formData.label || !formData.deviceId}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Saving...' : (mode === 'add' ? 'Add Compartment' : 'Update Compartment')}
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompartmentManagementModal;
