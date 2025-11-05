import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SmartBin } from "@/api/entities";
import { Compartment } from "@/api/entities";
import { SingleBin } from "@/api/entities";
import { Alert as AlertEntity } from "@/api/entities";
import { User } from "@/api/entities";
import { FirebaseService } from "@/services/firebaseService";
import { TestDataService } from "@/services/testDataService";
import { motion, AnimatePresence } from "framer-motion";
import "@/utils/debugFirestore";
import "@/utils/testBinIntegration";
import { 
  Trash2, 
  Activity,
  BarChart3,
  ChevronDown,
  FlaskConical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import StatsOverview from "../components/dashboard/StatsOverview";
import BinDetailsModal from "../components/modals/BinDetailsModal";
import SmartBinCard from "../components/dashboard/SmartBinCard";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import SingleBinDashboardCard from "../components/dashboard/SingleBinDashboardCard";

// Define a constant for max bins allowed on a free plan
const MAX_FREE_BINS = 10; // Example limit for demonstration

// ✅ OPTIMIZATION: Memoize components to prevent unnecessary re-renders
const MemoizedSmartBinCard = React.memo(SmartBinCard);
const MemoizedSingleBinDashboardCard = React.memo(SingleBinDashboardCard);
const MemoizedStatsOverview = React.memo(StatsOverview);
const MemoizedRecentAlerts = React.memo(RecentAlerts);

export default function Dashboard() {
  const [smartBins, setSmartBins] = useState([]);
  const [compartments, setCompartments] = useState([]);
  const [singleBins, setSingleBins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [smartBinOrder, setSmartBinOrder] = useState([]);
  const initializedRef = useRef(false);
  
  // Firebase real-time data
  const [realTimeData, setRealTimeData] = useState(null);
  const [isConnectedToFirebase, setIsConnectedToFirebase] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  
  // Collapsible states
  const [singleBinSectionExpanded, setSingleBinSectionExpanded] = useState(true);
  const [smartBinSectionExpanded, setSmartBinSectionExpanded] = useState(true);
  
  // ✅ NEW: Individual SingleBin card expanded states
  const [singleBinExpandedStates, setSingleBinExpandedStates] = useState({});
  const [allSingleBinsExpanded, setAllSingleBinsExpanded] = useState(false); // ✅ Changed to false for collapsed default

  // Bin details modal states
  const [showBinDetails, setShowBinDetails] = useState(false);
  const [selectedBinForDetails, setSelectedBinForDetails] = useState(null);
  const [selectedBinType, setSelectedBinType] = useState(null);

  // Test data mode state
  const [testDataEnabled, setTestDataEnabled] = useState(TestDataService.isTestDataEnabled);
  const [demoPhaseInfo, setDemoPhaseInfo] = useState(null);

  // ✅ OPTIMIZATION: Add refs to track renders and prevent excessive updates
  const lastDataLoadRef = useRef(Date.now());
  const dataLoadIntervalRef = useRef(null);
  const sensorUpdateTimeoutRef = useRef(null);

  console.log('🔄 Dashboard render'); // Track render count

  // ✅ OPTIMIZATION: Memoize device IDs to prevent unnecessary Firebase re-subscriptions
  const deviceIds = useMemo(() => {
    const singleBinDeviceIds = singleBins
      .map(bin => bin.iot_device_id || bin.device_id || bin.deviceId)
      .filter(Boolean);
    
    const compartmentDeviceIds = compartments
      .map(comp => comp.iot_device_id || comp.device_id || comp.deviceId)
      .filter(Boolean);
    
    return [...new Set([...singleBinDeviceIds, ...compartmentDeviceIds])];
  }, [singleBins.length, compartments.length]); // Only recalculate when counts change

  // ✅ OPTIMIZATION: Memoize sensor data sync function
  const syncSensorDataWithBins = useCallback((latestData) => {
    if (!latestData || latestData.length === 0) return;

    console.log('🔄 Syncing sensor data...');
    
    // Update singleBins
    setSingleBins(prevBins => 
      prevBins.map(bin => {
        const deviceId = bin.iot_device_id || bin.device_id || bin.deviceId;
        if (!deviceId) return bin;
        
        const latestSensorData = Array.isArray(latestData) 
          ? latestData.find(data => data.deviceId === deviceId) || latestData[0]
          : latestData;
        
        if (!latestSensorData || latestSensorData.deviceId !== deviceId) return bin;
        
        // Only update if data actually changed
        if (bin.distance === latestSensorData.distance && 
            bin.battery_level === latestSensorData.battery) {
          return bin;
        }
        
        return {
          ...bin,
          sensorValue: latestSensorData.distance ?? bin.sensorValue,
          sensor_value: latestSensorData.distance ?? bin.sensor_value,
          distance: latestSensorData.distance ?? bin.distance,
          fill_level: latestSensorData.fillLevel ?? bin.fill_level,
          current_fill: latestSensorData.fillLevel ?? bin.current_fill,
          battery_level: latestSensorData.battery ?? bin.battery_level,
          temperature: latestSensorData.temperature ?? bin.temperature,
          humidity: latestSensorData.humidity ?? bin.humidity,
          air_quality: latestSensorData.raw?.uplink_message?.decoded_payload?.air_quality || 
                      latestSensorData.raw?.decoded_payload?.air_quality ||
                      bin.air_quality,
          odour_level: latestSensorData.raw?.uplink_message?.decoded_payload?.odour_level || 
                      latestSensorData.raw?.decoded_payload?.odour_level ||
                      bin.odour_level,
          tilt_status: latestSensorData.tilt ?? bin.tilt_status,
          last_sensor_update: latestSensorData.timestamp || new Date().toISOString(),
          sensor_data_available: true
        };
      })
    );
    
    // Update compartments
    setCompartments(prevCompartments => 
      prevCompartments.map(compartment => {
        const deviceId = compartment.iot_device_id || compartment.device_id || compartment.deviceId;
        if (!deviceId) return compartment;
        
        const latestSensorData = Array.isArray(latestData) 
          ? latestData.find(data => data.deviceId === deviceId) || latestData[0]
          : latestData;
        
        if (!latestSensorData || latestSensorData.deviceId !== deviceId) return compartment;
        
        if (compartment.distance === latestSensorData.distance && 
            compartment.battery_level === latestSensorData.battery) {
          return compartment;
        }
        
        return {
          ...compartment,
          sensorValue: latestSensorData.distance ?? compartment.sensorValue,
          sensor_value: latestSensorData.distance ?? compartment.sensor_value,
          distance: latestSensorData.distance ?? compartment.distance,
          fill_level: latestSensorData.fillLevel ?? compartment.fill_level,
          current_fill: latestSensorData.fillLevel ?? compartment.current_fill,
          battery_level: latestSensorData.battery ?? compartment.battery_level,
          temperature: latestSensorData.temperature ?? compartment.temperature,
          humidity: latestSensorData.humidity ?? compartment.humidity,
          air_quality: latestSensorData.raw?.uplink_message?.decoded_payload?.air_quality || 
                      latestSensorData.raw?.decoded_payload?.air_quality ||
                      compartment.air_quality,
          odour_level: latestSensorData.raw?.uplink_message?.decoded_payload?.odour_level || 
                      latestSensorData.raw?.decoded_payload?.odour_level ||
                      compartment.odour_level,
          tilt_status: latestSensorData.tilt ?? compartment.tilt_status,
          last_sensor_update: latestSensorData.timestamp || new Date().toISOString(),
          sensor_data_available: true
        };
      })
    );
  }, []);

  // ✅ OPTIMIZATION: Subscribe to Firebase once with debouncing
  useEffect(() => {
    if (deviceIds.length === 0) {
      console.log('⚠️ No devices to subscribe to');
      return;
    }
    
    console.log(`📡 Setting up Firebase subscription for ${deviceIds.length} device(s)`);
    
    try {
      const unsubscribers = deviceIds.map(deviceId => {
        return FirebaseService.subscribeToSensorData(deviceId, (sensorData) => {
          console.log(`📊 Real-time data received for ${deviceId}`);
          
          // Debounce updates to prevent rapid re-renders
          if (sensorUpdateTimeoutRef.current) {
            clearTimeout(sensorUpdateTimeoutRef.current);
          }
          
          sensorUpdateTimeoutRef.current = setTimeout(() => {
            setRealTimeData(sensorData);
            setIsConnectedToFirebase(true);
            setFirebaseError(null);
          }, 500); // Wait 500ms for batched updates
        });
      });

      return () => {
        console.log('🛑 Cleaning up Firebase subscriptions');
        if (sensorUpdateTimeoutRef.current) {
          clearTimeout(sensorUpdateTimeoutRef.current);
        }
        unsubscribers.forEach(unsubscribe => {
          if (unsubscribe) unsubscribe();
        });
      };
    } catch (error) {
      console.error('Firebase subscription error:', error);
      setFirebaseError(error.message);
      setIsConnectedToFirebase(false);
    }
  }, [deviceIds.join(',')]); // Only re-subscribe when device IDs actually change

  // ✅ OPTIMIZATION: Use memoized sync function
  useEffect(() => {
    if (realTimeData) {
      syncSensorDataWithBins(realTimeData);
    }
  }, [realTimeData, syncSensorDataWithBins]);

  // ✅ NEW: Monitor bins and auto-create alerts when thresholds are exceeded
  useEffect(() => {
    // Only run if we have bins and compartments loaded
    if ((singleBins.length === 0 && compartments.length === 0) || loading) {
      return;
    }

    console.log('🚨 Setting up automatic alert monitoring...');

    // Helper function to calculate fill level (imported from utils)
    const calculateFillLevelHelper = (sensorValue, binHeight) => {
      if (!sensorValue || !binHeight || binHeight === 0) return 0;
      const fillLevel = ((binHeight - sensorValue) / binHeight) * 100;
      return Math.max(0, Math.min(100, Math.round(fillLevel)));
    };

    // Initial monitoring check
    const checkAndCreateAlerts = async () => {
      try {
        // Monitor bins and create alerts
        const newAlerts = await FirebaseService.monitorBinsAndCreateAlerts(
          singleBins,
          compartments,
          calculateFillLevelHelper
        );

        // If new alerts were created, reload alerts to show them
        if (newAlerts.length > 0) {
          const updatedAlerts = await FirebaseService.getAlerts();
          setAlerts(updatedAlerts);
          console.log(`✅ Dashboard alerts updated - ${newAlerts.length} new alert(s) added`);
        }

        // Auto-resolve alerts that are no longer needed
        await FirebaseService.autoResolveAlerts(
          singleBins,
          compartments,
          calculateFillLevelHelper
        );

      } catch (error) {
        console.error('❌ Error in alert monitoring:', error);
      }
    };

    // Run initial check
    checkAndCreateAlerts();

    // ✅ FIX: Set up interval to check every 5 minutes (300 seconds) instead of 60 seconds
    // This prevents excessive alert generation and relies on the locking mechanism in FirebaseService
    const alertMonitoringInterval = setInterval(() => {
      checkAndCreateAlerts();
    }, 300000); // Check every 5 minutes (300 seconds)

    return () => {
      clearInterval(alertMonitoringInterval);
      console.log('🛑 Alert monitoring stopped');
    };
  }, [singleBins, compartments, loading]); // Re-run when bins/compartments change

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        const currentUser = await User.me();
        
        // Check if admin is impersonating another user
        const impersonatedUserStr = localStorage.getItem('impersonatedUser');
        const effectiveUser = impersonatedUserStr ? JSON.parse(impersonatedUserStr) : currentUser;
        
        if (!isMounted) return;

        console.log("Loading Firebase data...");
        
        // Use test data if enabled
        if (TestDataService.isTestDataEnabled) {
          console.log("🧪 Test Data Mode: Loading test data...");
          const testData = TestDataService.generateTestData();
          
          if (!isMounted) return;
          
          setUser(effectiveUser);
          setSmartBins(testData.smartBins);
          setCompartments(testData.compartments);
          setSingleBins(testData.singleBins);
          setAlerts(testData.alerts);
          
          if (!initializedRef.current) {
            if (effectiveUser?.smartbin_order && Array.isArray(effectiveUser.smartbin_order)) {
              const storedOrder = effectiveUser.smartbin_order;
              const currentBinIds = new Set(testData.smartBins.filter(bin => bin && bin.id).map(bin => bin.id));
              const newOrder = storedOrder.filter(id => id != null && currentBinIds.has(id));
              testData.smartBins.forEach(bin => {
                if (bin && bin.id && !newOrder.includes(bin.id)) {
                  newOrder.push(bin.id);
                }
              });
              setSmartBinOrder(newOrder);
            } else if (testData.smartBins.length > 0) {
              setSmartBinOrder(testData.smartBins.filter(bin => bin && bin.id).map(bin => bin.id));
            }
            initializedRef.current = true;
          }
        } else {
          // ✅ FIX: Pass userId to Firebase methods to enable user-based filtering
          const userId = effectiveUser?.id || effectiveUser?.uid || null;
          console.log("Loading data for user:", userId);
          
          // Load real data with user filtering
          const [smartBinData, compartmentData, singleBinData, alertData, firebaseSmartBins, firebaseSingleBins] = await Promise.all([
            SmartBin.list().catch(err => {
              console.error("SmartBin.list error:", err);
              return [];
            }),
            FirebaseService.getCompartmentsWithSensorData(userId).catch(err => {
              console.error("FirebaseService.getCompartmentsWithSensorData error:", err);
              return [];
            }),
            SingleBin.list().catch(err => {
              console.error("SingleBin.list error:", err);
              return [];
            }),
            FirebaseService.getAlerts(userId).catch(err => {
              console.error("FirebaseService.getAlerts error:", err);
              return [];
            }),
            FirebaseService.getSmartBins(userId).catch(err => {
              console.error("FirebaseService.getSmartBins error:", err);
              return [];
            }),
            FirebaseService.getSingleBinsWithSensorData(userId).catch(err => {
              console.error("FirebaseService.getSingleBinsWithSensorData error:", err);
              return [];
            })
          ]);
          
          // ✅ FIX: Properly deduplicate combined data using Map for O(1) lookups
          // Use Map to track bins by ID and avoid duplicates
          const smartBinsMap = new Map();
          const singleBinsMap = new Map();
          
          // Add Firebase bins first (they have the most recent sensor data)
          firebaseSmartBins.forEach(bin => {
            if (bin && bin.id) {
              smartBinsMap.set(bin.id, { ...bin, source: 'firebase' });
            }
          });
          
          // Add API bins only if they don't already exist
          smartBinData.forEach(bin => {
            if (bin && bin.id && !smartBinsMap.has(bin.id)) {
              smartBinsMap.set(bin.id, { ...bin, source: 'api' });
            }
          });
          
          // Same for single bins - Firebase first
          firebaseSingleBins.forEach(bin => {
            if (bin && bin.id) {
              singleBinsMap.set(bin.id, { ...bin, source: 'firebase' });
            }
          });
          
          // Add API single bins only if they don't already exist
          singleBinData.forEach(bin => {
            if (bin && bin.id && !singleBinsMap.has(bin.id)) {
              singleBinsMap.set(bin.id, { ...bin, source: 'api' });
            }
          });
          
          // Convert Maps back to arrays
          const combinedSmartBins = Array.from(smartBinsMap.values());
          const combinedSingleBins = Array.from(singleBinsMap.values());
          
          console.log("✅ Deduplicated data:", { 
            firebaseSmartBins: firebaseSmartBins.length,
            apiSmartBins: smartBinData.length,
            combinedSmartBins: combinedSmartBins.length,
            firebaseSingleBins: firebaseSingleBins.length,
            apiSingleBins: singleBinData.length,
            combinedSingleBins: combinedSingleBins.length,
            firebaseCompartments: compartmentData.length,
            alerts: alertData.length
          });

          if (!isMounted) return;

          setUser(effectiveUser);
          setSmartBins(combinedSmartBins);
          setCompartments(compartmentData);
          setSingleBins(combinedSingleBins);
          setAlerts(alertData);
          
          if (!initializedRef.current) {
            if (effectiveUser?.smartbin_order && Array.isArray(effectiveUser.smartbin_order)) {
              const storedOrder = effectiveUser.smartbin_order;
              const currentBinIds = new Set(combinedSmartBins.filter(bin => bin && bin.id).map(bin => bin.id));
              const newOrder = storedOrder.filter(id => id != null && currentBinIds.has(id));
              combinedSmartBins.forEach(bin => {
                if (bin && bin.id && !newOrder.includes(bin.id)) {
                  newOrder.push(bin.id);
                }
              });
              setSmartBinOrder(newOrder);
            } else if (combinedSmartBins.length > 0) {
              setSmartBinOrder(combinedSmartBins.filter(bin => bin && bin.id).map(bin => bin.id));
            }
            initializedRef.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // ✅ OPTIMIZATION: Increase interval from 30s to 2 minutes
    dataLoadIntervalRef.current = setInterval(() => {
      if (isMounted) {
        console.log('⏰ Background refresh (2-min interval)');
        loadData();
      }
    }, 120000); // 2 minutes

    return () => {
      isMounted = false;
      if (dataLoadIntervalRef.current) {
        clearInterval(dataLoadIntervalRef.current);
      }
    };
  }, [testDataEnabled]);

  // Subscribe to test data updates
  useEffect(() => {
    const handleTestDataUpdate = (event) => {
      console.log('Test data updated:', event.detail);
      
      if (event.detail.stopped) {
        setTestDataEnabled(false);
        setDemoPhaseInfo(null);
        return;
      }
      
      // Update demo phase info
      const phaseInfo = TestDataService.getDemoPhaseInfo();
      setDemoPhaseInfo(phaseInfo);
      
      // Reload data when test data updates
      if (TestDataService.isTestDataEnabled) {
        const testData = TestDataService.getTestData();
        setSmartBins(testData.smartBins);
        setCompartments(TestDataService.getTestCompartments());
        setSingleBins(testData.singleBins);
        setAlerts(testData.alerts);
      }
    };

    window.addEventListener('testDataUpdated', handleTestDataUpdate);
    
    // Initialize demo phase info if test mode is active
    if (TestDataService.isTestDataEnabled) {
      setDemoPhaseInfo(TestDataService.getDemoPhaseInfo());
    }

    return () => {
      window.removeEventListener('testDataUpdated', handleTestDataUpdate);
    };
  }, []);

  // ✅ UPDATED: Initialize expanded states as collapsed (false) by default
  useEffect(() => {
    if (singleBins.length > 0) {
      // Initialize all bins as collapsed by default
      const initialStates = {};
      singleBins.forEach(bin => {
        if (singleBinExpandedStates[bin.id] === undefined) {
          initialStates[bin.id] = false; // ✅ Changed to false for collapsed default
        }
      });
      if (Object.keys(initialStates).length > 0) {
        setSingleBinExpandedStates(prev => ({ ...prev, ...initialStates }));
      }
    }
  }, [singleBins.length]);

  // ✅ OPTIMIZATION: Memoize event handlers
  const handleBinCardClick = useCallback((bin, type) => {
    console.log('Dashboard bin card clicked:', bin, type);
    setSelectedBinForDetails(bin);
    setSelectedBinType(type);
    setShowBinDetails(true);
  }, []);

  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newOrder = Array.from(smartBinOrder);
    const [reorderedItem] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destinationIndex, 0, reorderedItem);

    setSmartBinOrder(newOrder);
    
    try {
      if (user && user.id) {
        await User.updateMyUserData({ smartbin_order: newOrder });
      }
    } catch (error) {
      console.error("Error saving bin order:", error);
    }
  }, [smartBinOrder, user]);

  const handleToggleSingleBin = useCallback((binId) => {
    setSingleBinExpandedStates(prev => ({
      ...prev,
      [binId]: !prev[binId]
    }));
  }, []);

  const handleToggleAllSingleBins = useCallback(() => {
    const newExpandedState = !allSingleBinsExpanded;
    setAllSingleBinsExpanded(newExpandedState);
    
    const newStates = {};
    singleBins.forEach(bin => {
      newStates[bin.id] = newExpandedState;
    });
    setSingleBinExpandedStates(newStates);
  }, [allSingleBinsExpanded, singleBins]);

  // ✅ OPTIMIZATION: Memoize computed values
  const orderedSmartBins = useMemo(() => {
    return smartBinOrder
      .filter(id => id != null)
      .map(id => smartBins.find(bin => bin && bin.id === id))
      .filter(Boolean)
      .concat(smartBins.filter(bin => bin && bin.id && !smartBinOrder.includes(bin.id)));
  }, [smartBinOrder, smartBins]);

  // ✅ Calculate plan limits
  const isFreePlan = useMemo(() => {
    return !user?.subscription_plan || user.subscription_plan === 'free';
  }, [user?.subscription_plan]);

  const hasReachedSingleBinLimit = useMemo(() => {
    return isFreePlan && singleBins.length >= MAX_FREE_BINS;
  }, [isFreePlan, singleBins.length]);

  const hasReachedSmartBinLimit = useMemo(() => {
    return isFreePlan && smartBins.length >= MAX_FREE_BINS;
  }, [isFreePlan, smartBins.length]);

  const activeSmartBinsCount = useMemo(() => {
    const uniqueActiveIds = new Set(
      smartBins
        .filter(bin => bin && bin.id && bin.status === 'active')
        .map(bin => bin.id)
    );
    return uniqueActiveIds.size;
  }, [smartBins]);

  const activeSingleBins = useMemo(() => {
    return singleBins.filter(bin => bin.status === 'active').length;
  }, [singleBins]);

  const criticalAlerts = useMemo(() => {
    return alerts.filter(alert => alert.severity === 'critical');
  }, [alerts]);

  const avgFillLevel = useMemo(() => {
    return compartments && compartments.length > 0
      ? compartments.reduce((sum, comp) => sum + Number(comp.current_fill || 0), 0) / compartments.length
      : 0;
  }, [compartments]);

  const totalCompartments = useMemo(() => {
    return compartments.length + singleBins.length;
  }, [compartments.length, singleBins.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 dark:from-[#0F0818] dark:via-[#1a0a2e] dark:to-[#16213e]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
          >
            <Trash2 className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-gray-600 dark:text-purple-200 text-lg">Loading your dashboard...</p>
          <div className="mt-4 w-48 h-2 bg-gray-200 dark:bg-purple-900/50 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 dark:from-[#0F0818] dark:via-[#1a0a2e] dark:to-[#16213e] min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-tr from-pink-500/20 to-yellow-500/20 rounded-full blur-2xl"
          animate={{
            rotate: [0, 360],
            scale: [0.8, 1.3, 0.8],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full opacity-20"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeInOut"
            }}
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + i * 15}%`
            }}
          />
        ))}
      </div>

      {/* Demo Phase Description Banner */}
      {testDataEnabled && demoPhaseInfo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-2 border-purple-200 dark:border-purple-600 rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <FlaskConical className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                🎬 Demo Mode: {demoPhaseInfo.phaseName}
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-200">
                {demoPhaseInfo.phaseDescription}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((demoPhaseInfo.phase + 1) / demoPhaseInfo.totalPhases) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {demoPhaseInfo.phase + 1}/{demoPhaseInfo.totalPhases}
                </span>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-2">
                ⏱️ Phases auto-advance every 8 seconds • Watch the bins update in real-time
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center md:text-left relative"
      >
        <div className="flex flex-col md:flex-row items-center justify-between p-8 rounded-2xl bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-800/10 dark:from-purple-900/40 dark:via-indigo-900/40 dark:to-purple-800/40 backdrop-blur-sm border border-purple-200/30 dark:border-purple-600/50 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 opacity-20">
            <motion.div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), 
                                 radial-gradient(circle at 75% 75%, rgba(79, 70, 229, 0.3) 0%, transparent 50%)`,
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>

          <div className="mb-4 md:mb-0 relative z-10">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 dark:from-purple-300 dark:via-indigo-300 dark:to-purple-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋
            </motion.h1>
            <motion.p 
              className="text-gray-600 dark:text-purple-200 mt-2 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Monitor your smart waste management system in real-time
              {testDataEnabled && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-600">
                  <FlaskConical className="w-3 h-3 mr-1" />
                  Test Mode
                </span>
              )}
            </motion.p>
          </div>
          
          <motion.div
            className="flex items-center gap-2 text-sm bg-white/60 dark:bg-purple-800/40 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-200 dark:border-purple-600 shadow-lg relative z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className={`w-3 h-3 rounded-full mr-2 ${
                isConnectedToFirebase ? 'bg-green-500' : 'bg-red-500'
              }`}
              animate={isConnectedToFirebase ? { 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {isConnectedToFirebase ? 'Connected to IoT Network' : 'Connecting to IoT Network...'}
            {firebaseError && <span className="ml-2 text-xs">({firebaseError})</span>}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <MemoizedStatsOverview 
          activeSmartBins={activeSmartBinsCount}
          criticalAlerts={criticalAlerts.length}
          avgFillLevel={avgFillLevel}
          totalCompartments={totalCompartments}
          activeSingleBins={activeSingleBins}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* SingleBin Section with Modern Collapsible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-indigo-200 dark:border-indigo-700 shadow-xl">
              <CardHeader 
                className="cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all p-6"
                onClick={() => setSingleBinSectionExpanded(!singleBinSectionExpanded)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="relative"
                      animate={{ rotate: singleBinSectionExpanded ? 0 : 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Trash2 className="w-6 h-6 text-white" />
                      </div>
                      {!singleBinSectionExpanded && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl opacity-50"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-purple-100">
                        SingleBin Monitor
                      </CardTitle>
                      <p className="text-gray-600 dark:text-purple-200 mt-1">Individual waste bin monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {singleBins.length > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="bg-indigo-100 dark:bg-indigo-800/60 text-indigo-700 dark:text-indigo-200 px-3 py-1 text-sm font-medium"
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        {singleBins.filter(sb => sb.status === 'active').length} Active
                      </Badge>
                    )}
                    <motion.div
                      animate={{ 
                        rotate: singleBinSectionExpanded ? 0 : 180,
                        scale: singleBinSectionExpanded ? 1 : 0.9
                      }}
                      transition={{ duration: 0.3, type: "spring" }}
                      className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800/60 flex items-center justify-center"
                    >
                      <ChevronDown className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </motion.div>
                  </div>
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {singleBinSectionExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-6">
                      {singleBins.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="border-2 border-dashed border-indigo-200 dark:border-indigo-600 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                              <motion.div 
                                className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-2xl"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Trash2 className="w-10 h-10 text-white" />
                              </motion.div>
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-purple-100 mb-2">No SingleBins configured</h3>
                              <p className="text-gray-500 dark:text-purple-200 mb-6 text-center max-w-md">
                                Navigate to the Smart Bins page to add your first SingleBin.
                              </p>
                              {isFreePlan && (
                                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
                                  You can add up to {MAX_FREE_BINS} SingleBins on your free plan.
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ) : (
                        <>
                          <div className="flex justify-end mb-4">
                            <motion.button
                              onClick={handleToggleAllSingleBins}
                              className="relative px-4 py-2 rounded-lg font-medium text-white text-sm shadow-md overflow-hidden group"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {/* Animated gradient background */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"
                                animate={{
                                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                                style={{
                                  backgroundSize: '200% 200%'
                                }}
                              />
                              {/* Shine effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{
                                  x: ['-100%', '100%']
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                  repeatDelay: 1
                                }}
                              />
                              <span className="relative z-10 flex items-center gap-2">
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${allSingleBinsExpanded ? 'rotate-180' : ''}`} />
                                {allSingleBinsExpanded ? 'Collapse All' : 'Expand All'}
                              </span>
                            </motion.button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence>
                              {singleBins.map((singleBin, index) => (
                                <motion.div
                                  key={singleBin.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <MemoizedSingleBinDashboardCard 
                                    singleBin={singleBin} 
                                    onCardClick={handleBinCardClick}
                                    isExpanded={singleBinExpandedStates[singleBin.id]}
                                    onToggleExpand={() => handleToggleSingleBin(singleBin.id)}
                                  />
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* SmartBin Section with Modern Collapsible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: singleBins.length > 0 ? 0.7 : 0.6 }}
          >
            <Card className="overflow-hidden bg-gradient-to-br from-white to-purple-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-2 border-purple-200 dark:border-purple-700 shadow-xl">
              <CardHeader 
                className="cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all p-6"
                onClick={() => setSmartBinSectionExpanded(!smartBinSectionExpanded)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="relative"
                      animate={{ rotate: smartBinSectionExpanded ? 0 : 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Trash2 className="w-6 h-6 text-white" />
                      </div>
                      {!smartBinSectionExpanded && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl opacity-50"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-purple-100">
                        SmartBins Dashboard
                      </CardTitle>
                      <p className="text-gray-600 dark:text-purple-200 mt-1">
                        Multi-compartment monitoring • {smartBins.length > 0 ? "Drag to reorder" : "Get started"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {smartBins.length > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="bg-purple-100 dark:bg-purple-800/60 text-purple-700 dark:text-purple-200 px-3 py-1 text-sm font-medium"
                      >
                        <Activity className="w-4 h-4 mr-1" />
                        {activeSmartBinsCount} Active
                      </Badge>
                    )}
                    <motion.div
                      animate={{ 
                        rotate: smartBinSectionExpanded ? 0 : 180,
                        scale: smartBinSectionExpanded ? 1 : 0.9
                      }}
                      transition={{ duration: 0.3, type: "spring" }}
                      className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800/60 flex items-center justify-center"
                    >
                      <ChevronDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </motion.div>
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {smartBinSectionExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-6">
                      {smartBins.length === 0 || hasReachedSmartBinLimit ? (
                        <motion.div
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="border-2 border-dashed border-purple-200 dark:border-purple-600 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                              <motion.div 
                                className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-2xl"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Trash2 className="w-10 h-10 text-white" />
                              </motion.div>
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-purple-100 mb-2">
                                {hasReachedSmartBinLimit ? "SmartBin limit reached" : "No SmartBins configured"}
                              </h3>
                              <p className="text-gray-500 dark:text-purple-200 mb-6 text-center max-w-md">
                                {hasReachedSmartBinLimit 
                                  ? `You've reached the limit of ${MAX_FREE_BINS} SmartBins on your free plan. Upgrade to add more!`
                                  : "Navigate to the Smart Bins page to add your first SmartBin and begin monitoring your waste management system."
                                }
                              </p>
                              {isFreePlan && !hasReachedSmartBinLimit && (
                                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
                                  You can add up to {MAX_FREE_BINS} SmartBins on your free plan.
                                </p>
                              )}
                              {hasReachedSmartBinLimit && (
                                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg">
                                  Upgrade Plan
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ) : (
                        <>
                          <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="smartbins" type="SMARTBIN">
                              {(provided, snapshot) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={`space-y-4 transition-all duration-300 rounded-lg min-h-[200px] ${
                                    snapshot.isDraggingOver ? 'bg-purple-50/50 dark:bg-purple-900/20 p-4 border-2 border-dashed border-purple-300 dark:border-purple-600' : ''
                                  }`}
                                >
                                  <AnimatePresence>
                                    {orderedSmartBins.map((smartBin, index) => (
                                      <Draggable 
                                        key={smartBin.id} 
                                        draggableId={smartBin.id} 
                                        index={index}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`mb-4 ${snapshot.isDragging ? 'z-50' : ''}`}
                                          >
                                            <MemoizedSmartBinCard 
                                              smartBin={smartBin} 
                                              compartments={compartments.filter(c => c.smartbin_id === smartBin.id && smartBin.id != null)}
                                              alerts={alerts.filter(a => 
                                                compartments.some(c => c.id === a.compartment_id && c.smartbin_id === smartBin.id && smartBin.id != null && c.id != null)
                                              )}
                                              isDragging={snapshot.isDragging}
                                            />
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                  </AnimatePresence>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        </>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <MemoizedRecentAlerts alerts={alerts} />
          </motion.div>
          
          {smartBins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-[#2A1F3D] dark:to-[#1F0F2E] border-purple-200 dark:border-purple-600 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-purple-100">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </motion.div>
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-purple-200">Overall Status</span>
                    <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">
                      Excellent
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-purple-200">Active Monitors</span>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 bg-green-500 rounded-full"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="font-medium text-gray-900 dark:text-purple-100">{activeSmartBinsCount}/{smartBins.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bin Details Modal */}
      <BinDetailsModal
        isOpen={showBinDetails}
        onClose={() => {
          setShowBinDetails(false);
          setSelectedBinForDetails(null);
          setSelectedBinType(null);
        }}
        bin={selectedBinForDetails}
        binType={selectedBinType}
      />
    </div>
  );
}
