
import React, { useState, useEffect, useRef } from "react";
import { SmartBin } from "@/api/entities";
import { Compartment } from "@/api/entities";
import { SingleBin } from "@/api/entities";
import { Alert as AlertEntity } from "@/api/entities";
import { User } from "@/api/entities";
import { FirebaseService } from "@/services/firebaseService";
import { motion, AnimatePresence } from "framer-motion";
import "@/utils/debugFirestore";
import "@/utils/testBinIntegration";
import { 
  Trash2, 
  Activity,
  BarChart3,
  ChevronDown,
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
const MAX_FREE_BINS = 2; // Example limit for demonstration

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

  // Bin details modal states
  const [showBinDetails, setShowBinDetails] = useState(false);
  const [selectedBinForDetails, setSelectedBinForDetails] = useState(null);
  const [selectedBinType, setSelectedBinType] = useState(null);

  // Subscribe to real-time Firebase data
  useEffect(() => {
    console.log('Setting up Firebase real-time subscription...');
    setFirebaseError(null);
    
    try {
      const unsubscribe = FirebaseService.subscribeToSensorData('sortyx-sensor-two', (sensorData) => {
        console.log('Real-time sensor data received:', sensorData);
        setRealTimeData(sensorData);
        setIsConnectedToFirebase(true);
        setFirebaseError(null);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Firebase subscription error:', error);
      setFirebaseError(error.message);
      setIsConnectedToFirebase(false);
    }
  }, []);

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
        
        const [smartBinData, compartmentData, singleBinData, alertData, firebaseSmartBins, firebaseSingleBins] = await Promise.all([
          SmartBin.list().catch(err => {
            console.error("SmartBin.list error:", err);
            return [];
          }),
          Compartment.list().catch(err => {
            console.error("Compartment.list error:", err);
            return [];
          }),
          SingleBin.list().catch(err => {
            console.error("SingleBin.list error:", err);
            return [];
          }),
          FirebaseService.getAlerts().catch(err => {
            console.error("FirebaseService.getAlerts error:", err);
            return [];
          }),
          FirebaseService.getSmartBins().catch(err => {
            console.error("FirebaseService.getSmartBins error:", err);
            return [];
          }),
          FirebaseService.getSingleBins().catch(err => {
            console.error("FirebaseService.getSingleBins error:", err);
            return [];
          })
        ]);
        
        // Combine API data with Firebase data
        const combinedSmartBins = [...smartBinData, ...firebaseSmartBins];
        const combinedSingleBins = [...singleBinData, ...firebaseSingleBins];
        
        console.log("Firebase SmartBins:", firebaseSmartBins);
        console.log("Firebase SingleBins:", firebaseSingleBins);
        console.log("Firebase Alerts:", alertData);
        
        console.log("Firebase API responses:", { 
          smartBinData, 
          compartmentData, 
          singleBinData, 
          alertData,
          firebaseSmartBins,
          firebaseSingleBins,
          combinedSmartBins,
          combinedSingleBins
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
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // const interval = setInterval(() => {
    //   if (isMounted) {
    //     loadData();
    //   }
    // }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle bin card click to show details
  const handleBinCardClick = (bin, type) => {
    console.log('Dashboard bin card clicked:', bin, type);
    setSelectedBinForDetails(bin);
    setSelectedBinType(type);
    setShowBinDetails(true);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newOrder = Array.from(smartBinOrder);
    const [reorderedItem] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destinationIndex, 0, reorderedItem);

    setSmartBinOrder(newOrder);
    
    try {
      // This will update the smartbin_order for the currently logged-in user.
      if (user && user.id) {
        await User.updateMyUserData({ smartbin_order: newOrder });
      } else {
        console.error("Cannot update user data: user is null or missing ID", user);
      }
    } catch (error) {
      console.error("Error saving bin order:", error);
    }
  };

  const orderedSmartBins = smartBinOrder
    .filter(id => id != null)
    .map(id => smartBins.find(bin => bin && bin.id === id))
    .filter(Boolean)
    .concat(smartBins.filter(bin => bin && bin.id && !smartBinOrder.includes(bin.id)));

  const activeSmartBins = singleBins.filter(bin => bin.status === 'active');
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  // const avgFillLevel = compartments.length > 0 
  //   ? compartments.reduce((sum, comp) => sum + Number(comp.current_fill || 0), 0) / compartments.length 
  //   : 0;
  const avgFillLevel = compartments && compartments.length > 0
  ? compartments.reduce((sum, comp) => sum + Number(comp.current_fill || 0), 0) / compartments.length
  : 0;
  compartments.forEach(c => console.log("compartments: ",c));
  console.log("Average Fill Level:", compartments);


  // Check if the user is on a free plan and has reached the limit
  const isFreePlan = user?.plan === 'free';
  const hasReachedSmartBinLimit = isFreePlan && smartBins.length >= MAX_FREE_BINS;
  const hasReachedSingleBinLimit = isFreePlan && singleBins.length >= MAX_FREE_BINS;


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

      {/* Firebase Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
          isConnectedToFirebase 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700'
        }`}>
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
        </div>
      </motion.div>

      {/* Real-time Sensor Data Display */}
      {realTimeData && realTimeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
            />
            Latest IoT Sensor Reading
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400">Distance</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{realTimeData[0].distance} cm</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400">Fill Level</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{realTimeData[0].fillLevel}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400">Battery</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{realTimeData[0].battery}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400">Status</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 capitalize">{realTimeData[0].tilt}</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Device: {realTimeData[0].deviceId}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Last Update: {new Date(realTimeData[0].timestamp).toLocaleString()}
            </p>
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
            </motion.p>
          </div>
          
          <motion.div
            className="flex items-center gap-2 text-sm bg-white/60 dark:bg-purple-800/40 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-200 dark:border-purple-600 shadow-lg relative z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="w-3 h-3 bg-green-500 rounded-full shadow-lg"
              animate={{ 
                scale: [1, 1.3, 1],
                boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 10px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-gray-700 dark:text-purple-200 font-medium">System Online</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <StatsOverview 
          activeSmartBins={activeSmartBins.length}
          criticalAlerts={criticalAlerts.length}
          avgFillLevel={avgFillLevel}
          totalCompartments={compartments.length}
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
                          {isFreePlan && !hasReachedSingleBinLimit && (
                            <div className="mb-4 text-center text-sm text-yellow-600 dark:text-yellow-300">
                              You have {MAX_FREE_BINS - singleBins.length} SingleBins remaining on your free plan.
                            </div>
                          )}
                          {hasReachedSingleBinLimit && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mb-4 text-center border border-yellow-200 dark:border-yellow-700"
                            >
                              You've reached the limit of {MAX_FREE_BINS} SingleBins on your free plan. Upgrade to add more!
                            </motion.div>
                          )}
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
                                  <SingleBinDashboardCard 
                                    singleBin={singleBin} 
                                    onCardClick={handleBinCardClick}
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
                        {activeSmartBins.length} Active
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
                          {isFreePlan && !hasReachedSmartBinLimit && (
                            <div className="mb-4 text-center text-sm text-yellow-600 dark:text-yellow-300">
                              You have {MAX_FREE_BINS - smartBins.length} SmartBins remaining on your free plan.
                            </div>
                          )}
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
                                            <SmartBinCard 
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
            <RecentAlerts alerts={alerts} />
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
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9 }}
                    >
                      <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">
                        Excellent
                      </Badge>
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-purple-200">Active Monitors</span>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 bg-green-500 rounded-full"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="font-medium text-gray-900 dark:text-purple-100">{activeSmartBins.length}/{smartBins.length}</span>
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
