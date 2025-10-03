import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi, Battery, Gauge, MapPin, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FirebaseService } from '@/services/firebaseService';

const BinDetailsModal = ({ isOpen, onClose, bin, binType = 'singlebin' }) => {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);

  // Subscribe to real-time data when modal is open
  useEffect(() => {
    if (isOpen && bin && bin.deviceId) {
      setLoading(true);
      setError(null);
      
      console.log(`Subscribing to device: ${bin.deviceId}`);
      
      const unsubscribe = FirebaseService.subscribeToSensorData(
        bin.deviceId,
        (sensorData) => {
          console.log('Live sensor data received:', sensorData);
          if (sensorData && sensorData.length > 0) {
            setLiveData(sensorData[0]);
            setConnectionStatus('connected');
            setError(null);
          } else {
            setConnectionStatus('no-data');
          }
          setLoading(false);
        },
        (error) => {
          console.error('Firebase subscription error:', error);
          setError(error.message);
          setConnectionStatus('error');
          setLoading(false);
        }
      );

      // Also try to get latest data immediately
      FirebaseService.getLatestSensorData(bin.deviceId)
        .then((data) => {
          if (data) {
            setLiveData(data);
            setConnectionStatus('connected');
          }
        })
        .catch((err) => {
          console.log('No immediate data available:', err);
        });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [isOpen, bin]);

  const calculateFillLevel = (distance, binHeight) => {
    if (!distance || !binHeight || isNaN(distance) || isNaN(binHeight)) return 0;
    const fillLevel = ((binHeight - distance) / binHeight) * 100;
    if (isNaN(fillLevel)) return 0;
    return Math.max(0, Math.min(100, Math.round(fillLevel)));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'no-data': return 'text-orange-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'no-data': return 'No Data';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  if (!isOpen || !bin) return null;

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
                <Gauge className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{bin.name}</h2>
                <p className="text-purple-100 text-sm">Live IoT Sensor Data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                <span className="text-white text-sm">{getStatusText(connectionStatus)}</span>
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
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Bin Information */}
              <div className="space-y-6">
                <Card className="border-purple-200 dark:border-purple-600">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-purple-100">Bin Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-purple-300">Type</p>
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          {binType === 'smartbin' ? 'SmartBin' : 'SingleBin'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-purple-300">Status</p>
                        <p className="font-medium dark:text-purple-100">{bin.status || 'Active'}</p>
                      </div>
                    </div>

                    {bin.location && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-purple-300">Location</p>
                        <p className="font-medium flex items-center gap-1 dark:text-purple-100">
                          <MapPin className="w-4 h-4" />
                          {bin.location}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-purple-300">Capacity</p>
                        <p className="font-medium dark:text-purple-100">{bin.capacity || 'N/A'} L</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-purple-300">Height</p>
                        <p className="font-medium dark:text-purple-100">{bin.binHeight || 'N/A'} cm</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-purple-300">Device ID</p>
                      <p className="font-mono text-sm bg-gray-100 dark:bg-purple-900/20 p-2 rounded dark:text-purple-100">
                        {bin.deviceId}
                      </p>
                    </div>

                    {bin.created_date && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-purple-300">Created</p>
                        <p className="font-medium flex items-center gap-1 dark:text-purple-100">
                          <Calendar className="w-4 h-4" />
                          {new Date(bin.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Live Sensor Data */}
              <div className="space-y-6">
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800 dark:text-green-300 flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-green-500 rounded-full"
                      />
                      Live Sensor Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <p className="text-green-700 dark:text-green-300">Loading sensor data...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400 mb-2">Connection Error</p>
                        <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
                      </div>
                    ) : liveData ? (
                      <div className="space-y-6">
                        {/* Primary Sensor Data */}
                        <div className="grid grid-cols-1 gap-4">
                          {/* Battery */}
                          <div className="bg-white dark:bg-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Battery className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-700 dark:text-green-300">Battery</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                                  {liveData.battery}%
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  {liveData.battery > 50 ? 'Good' : liveData.battery > 20 ? 'Low' : 'Critical'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Distance */}
                          <div className="bg-white dark:bg-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-green-700 dark:text-green-300">Distance</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                                  {liveData.distance} cm
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  Fill: {calculateFillLevel(liveData.distance, bin.binHeight || 100)}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tilt Status */}
                          <div className="bg-white dark:bg-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-orange-600" />
                                <span className="text-sm text-green-700 dark:text-green-300">Tilt Status</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-green-800 dark:text-green-200 capitalize">
                                  {liveData.tilt}
                                </div>
                                <div className="flex items-center gap-1">
                                  {liveData.tilt === 'normal' ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 text-orange-500" />
                                  )}
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    {liveData.tilt === 'normal' ? 'Stable' : 'Attention Required'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Data */}
                        {liveData.timestamp && (
                          <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-700">
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Last updated: {new Date(liveData.timestamp).toLocaleString()}
                            </p>
                            <p className="text-xs text-green-500 dark:text-green-300 mt-1">
                              Collection: {bin.iotConfig?.collection || 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wifi className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-2">No sensor data available</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Make sure the device "{bin.deviceId}" is connected and sending data
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-8 pt-6 border-t border-purple-200 dark:border-purple-600">
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BinDetailsModal;