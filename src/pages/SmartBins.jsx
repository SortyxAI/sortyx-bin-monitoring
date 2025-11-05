import React, { useState, useEffect, useRef } from "react";
import { SmartBin } from "@/api/entities";
import { Compartment } from "@/api/entities";
import { SingleBin } from "@/api/entities";
import { User } from "@/api/entities";
import { FirebaseService } from "@/services/firebaseService";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Settings,
  MapPin,
  Edit,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import SmartBinForm from "../components/smartbins/SmartBinForm";
import CompartmentForm from "../components/smartbins/CompartmentForm";
import CompartmentCard from "../components/smartbins/CompartmentCard";
import SingleBinForm from "../components/singlebins/SingleBinForm";
import SingleBinCard from "../components/singlebins/SingleBinCard";
import BinDetailsModal from "../components/modals/BinDetailsModal";
import AddBinModal from "../components/modals/AddBinModal";
import ImprovedAddBinModal from "../components/modals/ImprovedAddBinModal";
import CompartmentManagementModal from "../components/modals/CompartmentManagementModal";
import MultiCompartmentSmartBinModal from "../components/modals/MultiCompartmentSmartBinModal";

export default function SmartBins() {
  // Existing SmartBin states
  const [smartBins, setSmartBins] = useState([]);
  const [compartments, setCompartments] = useState([]);
  const [showBinForm, setShowBinForm] = useState(false);
  const [showCompartmentForm, setShowCompartmentForm] = useState(false);
  const [editingBin, setEditingBin] = useState(null);
  const [editingCompartment, setEditingCompartment] = useState(null);
  const [selectedSmartBin, setSelectedSmartBin] = useState(null);
  const [expandedBins, setExpandedBins] = useState(new Set());

  // New SingleBin states
  const [singleBins, setSingleBins] = useState([]);
  const [showSingleBinForm, setShowSingleBinForm] = useState(false);
  const [editingSingleBin, setEditingSingleBin] = useState(null);
  const [expandedSingleBins, setExpandedSingleBins] = useState(new Set());
  const [singleBinSectionExpanded, setSingleBinSectionExpanded] = useState(true);
  const [smartBinSectionExpanded, setSmartBinSectionExpanded] = useState(true);

  const [loading, setLoading] = useState(true);

  // Bin details modal states
  const [showBinDetails, setShowBinDetails] = useState(false);
  const [selectedBinForDetails, setSelectedBinForDetails] = useState(null);
  const [selectedBinType, setSelectedBinType] = useState(null);

  // Add Bin Modal states
  const [isAddSmartBinModalOpen, setIsAddSmartBinModalOpen] = useState(false);
  const [isAddSingleBinModalOpen, setIsAddSingleBinModalOpen] = useState(false);
  
  // Edit Bin Modal states (for updates)
  const [isEditSmartBinModalOpen, setIsEditSmartBinModalOpen] = useState(false);
  const [isEditSingleBinModalOpen, setIsEditSingleBinModalOpen] = useState(false);
  const [binToEdit, setBinToEdit] = useState(null);
  
  // Compartment Management Modal state
  const [isCompartmentModalOpen, setIsCompartmentModalOpen] = useState(false);
  const [smartBinForCompartments, setSmartBinForCompartments] = useState(null);
  const [initialCompartmentToEdit, setInitialCompartmentToEdit] = useState(null);

  // Refs for scrolling to forms
  const binFormRef = useRef(null);
  const compartmentFormRef = useRef(null);
  const singleBinFormRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // Effects for scrolling to forms
  useEffect(() => {
    if (showBinForm && binFormRef.current) {
      setTimeout(() => {
        binFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showBinForm]);

  useEffect(() => {
    if (showCompartmentForm && compartmentFormRef.current) {
      setTimeout(() => {
        compartmentFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showCompartmentForm]);

  useEffect(() => {
    if (showSingleBinForm && singleBinFormRef.current) {
      setTimeout(() => {
        singleBinFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showSingleBinForm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await User.me();
      
      // Check if admin is impersonating another user
      const impersonatedUserStr = localStorage.getItem('impersonatedUser');
      const effectiveUser = impersonatedUserStr ? JSON.parse(impersonatedUserStr) : currentUser;
      
      // ✅ FIX: Get userId to pass to Firebase methods for user-based filtering
      const userId = effectiveUser?.id || effectiveUser?.uid || null;
      console.log("SmartBins page - Loading data for user:", userId);
      
      const [smartBinData, compartmentData, singleBinData, firebaseSmartBins, firebaseSingleBins] = await Promise.all([
        SmartBin.filter({ created_by: effectiveUser.email }).catch(() => []),
        Compartment.list('-created_date').catch(() => []),
        SingleBin.filter({ created_by: effectiveUser.email }).catch(() => []),
        FirebaseService.getSmartBins(userId).catch(() => []),
        FirebaseService.getSingleBins(userId).catch(() => [])
      ]);
      
      // ✅ FIX: Properly deduplicate combined data using Map for O(1) lookups
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
      
      console.log("SmartBins page - ✅ Deduplicated data:", { 
        firebaseSmartBins: firebaseSmartBins.length,
        apiSmartBins: smartBinData.length,
        combinedSmartBins: combinedSmartBins.length,
        firebaseSingleBins: firebaseSingleBins.length,
        apiSingleBins: singleBinData.length,
        combinedSingleBins: combinedSingleBins.length,
        compartments: compartmentData.length
      });
      
      setSmartBins(combinedSmartBins);
      setCompartments(compartmentData);
      setSingleBins(combinedSingleBins);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBin = async (binData) => {
    try {
      if (editingBin) {
        await SmartBin.update(editingBin.id, binData);
      } else {
        await SmartBin.create(binData);
      }
      setShowBinForm(false);
      setEditingBin(null);
      await loadData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error saving SmartBin:", error);
    }
  };

  const handleSaveCompartment = async (compartmentData) => {
    try {
      console.log('Saving compartment:', compartmentData);
      
      // Add smartBinId to compartment data
      const dataToSave = {
        ...compartmentData,
        smartBinId: selectedSmartBin?.id || compartmentData.smartBinId,
        smartbin_id: selectedSmartBin?.id || compartmentData.smartbin_id,
      };
      
      // Save to Firestore
      const savedCompartment = await FirebaseService.saveCompartment(dataToSave);
      console.log('Compartment saved successfully:', savedCompartment);
      
      // Show success message
      alert(`Compartment "${dataToSave.label}" ${editingCompartment ? 'updated' : 'added'} successfully!\n\nSensors enabled: ${Object.keys(dataToSave.sensors_enabled || {}).filter(k => dataToSave.sensors_enabled[k]).join(', ')}`);
      
      // Reset form and reload data
      setShowCompartmentForm(false);
      setEditingCompartment(null);
      setSelectedSmartBin(null);
      await loadData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error saving compartment:", error);
      alert(`Failed to save compartment: ${error.message}`);
    }
  };

  const handleSaveSingleBin = async (singleBinData) => {
    try {
      console.log('Saving single bin:', singleBinData);
      
      // Save to Firestore
      const savedSingleBin = await FirebaseService.saveSingleBin(singleBinData);
      console.log('SingleBin saved successfully:', savedSingleBin);
      
      // Show success message
      alert(`SingleBin "${singleBinData.name}" ${editingSingleBin ? 'updated' : 'added'} successfully!\n\nSensors enabled: ${Object.keys(singleBinData.sensors_enabled || {}).filter(k => singleBinData.sensors_enabled[k]).join(', ')}`);
      
      // Reset form and reload data
      setShowSingleBinForm(false);
      setEditingSingleBin(null);
      await loadData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error saving SingleBin:", error);
      alert(`Failed to save single bin: ${error.message}`);
    }
  };

  const handleDeleteBin = async (binId) => {
    if (window.confirm('Are you sure you want to delete this SmartBin? All compartments will also be deleted.')) {
      try {
        console.log('Deleting smart bin:', binId);
        await FirebaseService.deleteSmartBin(binId);
        console.log('Smart bin deleted successfully');
        alert('Smart bin and its compartments deleted successfully!');
        loadData();
      } catch (error) {
        console.error("Error deleting SmartBin:", error);
        alert(`Failed to delete smart bin: ${error.message}`);
      }
    }
  };

  const handleDeleteCompartment = async (compartmentId) => {
    if (window.confirm('Are you sure you want to delete this compartment?')) {
      try {
        console.log('Deleting compartment:', compartmentId);
        await FirebaseService.deleteCompartment(compartmentId);
        console.log('Compartment deleted successfully');
        alert('Compartment deleted successfully!');
        loadData();
      } catch (error) {
        console.error("Error deleting compartment:", error);
        alert(`Failed to delete compartment: ${error.message}`);
      }
    }
  };

  const handleDeleteSingleBin = async (singleBinId) => {
    if (window.confirm('Are you sure you want to delete this SingleBin?')) {
      try {
        console.log('Deleting single bin:', singleBinId);
        await FirebaseService.deleteSingleBin(singleBinId);
        console.log('Single bin deleted successfully');
        alert('Single bin deleted successfully!');
        loadData();
      } catch (error) {
        console.error("Error deleting SingleBin:", error);
        alert(`Failed to delete single bin: ${error.message}`);
      }
    }
  };

  // Handle bin card click to show details
  const handleBinCardClick = (bin, type) => {
    console.log('Bin card clicked:', bin, type);
    setSelectedBinForDetails(bin);
    setSelectedBinType(type);
    setShowBinDetails(true);
  };

  const toggleBinExpansion = (binId) => {
    setExpandedBins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(binId)) {
        newSet.delete(binId);
      } else {
        newSet.add(binId);
      }
      return newSet;
    });
  };

  const toggleSingleBinExpansion = (binId) => {
    setExpandedSingleBins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(binId)) {
        newSet.delete(binId);
      } else {
        newSet.add(binId);
      }
      return newSet;
    });
  };

  // Handle adding new bin from modal
  const handleAddBin = async (binData) => {
    try {
      console.log('Adding new bin:', binData);
      
      // Save to Firebase based on bin type
      let savedBin;
      if (binData.type === 'smart' || binData.type === 'smartbin') {
        savedBin = await FirebaseService.saveSmartBin(binData);
        console.log('Smart bin saved to smart-bins collection:', savedBin);
      } else {
        savedBin = await FirebaseService.saveSingleBin(binData);
        console.log('Single bin saved to single-bins collection:', savedBin);
      }
      
      console.log('Bin saved successfully:', savedBin);
      
      // Show success message
      const binTypeName = (binData.type === 'smart' || binData.type === 'smartbin') ? 'Smart Bin' : 'Single Bin';
      alert(`${binTypeName} "${binData.name}" added successfully with IoT device "${binData.deviceId}"!\n\nSensors enabled: ${Object.keys(binData.sensors_enabled || {}).filter(k => binData.sensors_enabled[k]).join(', ')}`);
      
      // Reload the data to show the new bin
      await loadData();
      
    } catch (error) {
      console.error('Error adding bin:', error);
      alert(`Failed to add bin: ${error.message}`);
      throw error;
    }
  };

  // Handle updating existing bin from modal
  const handleUpdateBin = async (binData) => {
    try {
      console.log('Updating bin:', binData);
      
      // Update Firebase based on bin type
      let updatedBin;
      if (binData.type === 'smart' || binData.type === 'smartbin') {
        updatedBin = await FirebaseService.saveSmartBin({ ...binData, id: binToEdit.id });
        console.log('Smart bin updated:', updatedBin);
      } else {
        updatedBin = await FirebaseService.saveSingleBin({ ...binData, id: binToEdit.id });
        console.log('Single bin updated:', updatedBin);
      }
      
      // Show success message
      const binTypeName = (binData.type === 'smart' || binData.type === 'smartbin') ? 'Smart Bin' : 'Single Bin';
      alert(`${binTypeName} "${binData.name}" updated successfully!`);
      
      // Reload the data
      await loadData();
      
    } catch (error) {
      console.error('Error updating bin:', error);
      alert(`Failed to update bin: ${error.message}`);
      throw error;
    }
  };

  // Open edit modal for SmartBin
  const handleEditSmartBin = (smartBin) => {
    setBinToEdit(smartBin);
    setIsEditSmartBinModalOpen(true);
  };

  // Open edit modal for SingleBin
  const handleEditSingleBin = (singleBin) => {
    setBinToEdit(singleBin);
    setIsEditSingleBinModalOpen(true);
  };

  // Open compartment management modal
  const handleManageCompartments = (smartBin) => {
    setSmartBinForCompartments(smartBin);
    setIsCompartmentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading bin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white max-[500px]:text-2xl">Bin Management Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Configure and manage your smart waste bins and single waste units</p>
      </motion.div>

      {/* SingleBin Section */}
      <section className="mb-12">
        <div 
          className="flex justify-between items-center mb-6 cursor-pointer"
          onClick={() => setSingleBinSectionExpanded(!singleBinSectionExpanded)}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: singleBinSectionExpanded ? 0 : -90 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">SingleBins</h2>
            <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-800/60 text-indigo-700 dark:text-indigo-200">
              {singleBins.length} bins
            </Badge>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setEditingSingleBin(null);
              setShowSingleBinForm(true);
              setShowBinForm(false);
              setShowCompartmentForm(false);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add SingleBin
          </Button>
        </div>

        <AnimatePresence>
          {singleBinSectionExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {showSingleBinForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    ref={singleBinFormRef}
                    className="mb-6"
                  >
                    <SingleBinForm
                      singleBin={editingSingleBin}
                      onSave={handleSaveSingleBin}
                      onCancel={() => {
                        setShowSingleBinForm(false);
                        setEditingSingleBin(null);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {singleBins.length === 0 && !showSingleBinForm ? (
                <Card className="border-2 border-dashed border-indigo-200 dark:border-indigo-700 bg-gradient-to-br from-indigo-50/50 to-cyan-50/50 dark:from-indigo-900/20 dark:to-cyan-900/20">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-800/50 rounded-full flex items-center justify-center mb-4">
                      <Trash2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No SingleBins yet</h3>
                    <p className="text-gray-500 dark:text-gray-300 mb-4 text-center">
                      Add your first SingleBin to monitor individual waste units
                    </p>
                    <Button
                      onClick={() => {
                        setEditingSingleBin(null);
                        setShowSingleBinForm(true);
                        setShowBinForm(false);
                        setShowCompartmentForm(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create SingleBin
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {singleBins.map((singleBin, index) => (
                    <motion.div
                      key={singleBin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden dark:bg-[#241B3A] dark:border-indigo-700">
                        <CardHeader 
                          className="cursor-pointer bg-gradient-to-r from-white/60 to-indigo-50/60 dark:from-indigo-900/30 dark:via-indigo-800/40 dark:to-indigo-900/50"
                          onClick={() => toggleSingleBinExpansion(singleBin.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                                {singleBin.name}
                                <Badge className={
                                  singleBin.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                  singleBin.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
                                }>
                                  {singleBin.status}
                                </Badge>
                              </CardTitle>
                              {singleBin.location && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300 mt-1">
                                  <MapPin className="w-4 h-4" />
                                  {singleBin.location}
                                </div>
                              )}
                              {!expandedSingleBins.has(singleBin.id) && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  Fill: {singleBin.current_fill || 0}% • Capacity: {singleBin.capacity}L
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="dark:bg-[#241B3A] dark:border-indigo-700">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingSingleBin(singleBin);
                                      setShowSingleBinForm(true);
                                      setShowBinForm(false);
                                      setShowCompartmentForm(false);
                                    }}
                                    className="dark:text-gray-200 dark:hover:bg-indigo-500/20"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit SingleBin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSingleBin(singleBin.id);
                                    }}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete SingleBin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="dark:text-gray-300 dark:hover:bg-indigo-600/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSingleBinExpansion(singleBin.id);
                                }}
                              >
                                <motion.div
                                  animate={{ rotate: expandedSingleBins.has(singleBin.id) ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </motion.div>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {expandedSingleBins.has(singleBin.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CardContent className="dark:bg-[#1F1235]/50 pt-4">
                                <SingleBinCard
                                  singleBin={singleBin}
                                  onEdit={() => {
                                    setEditingSingleBin(singleBin);
                                    setShowSingleBinForm(true);
                                    setShowBinForm(false);
                                    setShowCompartmentForm(false);
                                  }}
                                  onDelete={() => handleDeleteSingleBin(singleBin.id)}
                                  onCardClick={handleBinCardClick}
                                />
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SmartBin Section */}
      <section className="mb-12">
        <div 
          className="flex justify-between items-center mb-6 cursor-pointer"
          onClick={() => setSmartBinSectionExpanded(!smartBinSectionExpanded)}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: smartBinSectionExpanded ? 0 : -90 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </motion.div>
            <h2 className="text-2xl max-[447px]:text-[20px] font-semibold text-gray-900 dark:text-white">SmartBins (Multi-Compartment)</h2>
            <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-800/60 text-purple-700 dark:text-purple-200">
              {smartBins.length} bins
            </Badge>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              // Open MultiCompartmentSmartBinModal for creating new SmartBin
              setIsEditSmartBinModalOpen(true);
              setBinToEdit(null);
            }}
            className="bg-purple-600 hover:bg-purple-700  max-[400px]:px-2 max-[400px]:py-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add SmartBin
          </Button>
        </div>

        <AnimatePresence>
          {smartBinSectionExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {showBinForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    ref={binFormRef}
                    className="mb-6"
                  >
                    <SmartBinForm
                      smartBin={editingBin}
                      onSave={handleSaveBin}
                      onCancel={() => {
                        setShowBinForm(false);
                        setEditingBin(null);
                      }}
                    />
                  </motion.div>
                )}
                
                {showCompartmentForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    ref={compartmentFormRef}
                    className="mb-6"
                  >
                    <CompartmentForm
                      compartment={editingCompartment}
                      smartBin={selectedSmartBin}
                      onSave={handleSaveCompartment}
                      onCancel={() => {
                        setShowCompartmentForm(false);
                        setEditingCompartment(null);
                        setSelectedSmartBin(null);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {smartBins.length === 0 && !showBinForm ? (
                <Card className="border-2 border-dashed border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800/50 rounded-full flex items-center justify-center mb-4">
                      <Trash2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No SmartBins yet</h3>
                    <p className="text-gray-500 dark:text-gray-300 mb-4 text-center">
                      Create your first SmartBin to start monitoring your waste management system
                    </p>
                    <Button
                      onClick={() => {
                        setIsEditSmartBinModalOpen(true);
                        setBinToEdit(null);
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create SmartBin
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {smartBins.map((smartBin, index) => (
                    <motion.div
                      key={smartBin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden dark:bg-[#241B3A] dark:border-purple-700">
                        <CardHeader 
                          className="cursor-pointer bg-gradient-to-r from-white/60 to-purple-50/60 dark:from-purple-900/30 dark:via-purple-800/40 dark:to-purple-900/50"
                          onClick={() => toggleBinExpansion(smartBin.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                                {smartBin.name}
                                <Badge className={
                                  smartBin.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                  smartBin.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300'
                                }>
                                  {smartBin.status}
                                </Badge>
                              </CardTitle>
                              {smartBin.location && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300 mt-1">
                                  <MapPin className="w-4 h-4" />
                                  {smartBin.location}
                                </div>
                              )}
                              {smartBin.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{smartBin.description}</p>
                              )}
                              {!expandedBins.has(smartBin.id) && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  {compartments.filter(c => c.smartbin_id === smartBin.id).length} compartments
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="dark:bg-[#241B3A] dark:border-purple-700">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingBin(smartBin);
                                      setShowBinForm(true);
                                      setShowCompartmentForm(false);
                                      setShowSingleBinForm(false);
                                    }}
                                    className="dark:text-gray-200 dark:hover:bg-purple-500/20"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit SmartBin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSmartBinForCompartments(smartBin);
                                      setInitialCompartmentToEdit(null);
                                      setIsCompartmentModalOpen(true);
                                    }}
                                    className="dark:text-gray-200 dark:hover:bg-purple-500/20"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Compartment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleManageCompartments(smartBin);
                                    }}
                                    className="dark:text-gray-200 dark:hover:bg-purple-500/20"
                                  >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Manage Compartments
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBin(smartBin.id);
                                    }}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete SmartBin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="dark:text-gray-300 dark:hover:bg-purple-600/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBinExpansion(smartBin.id);
                                }}
                              >
                                <motion.div
                                  animate={{ rotate: expandedBins.has(smartBin.id) ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </motion.div>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {expandedBins.has(smartBin.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CardContent className="dark:bg-[#1F1235]/50 pt-4">
                                <div className="mb-4 flex justify-between items-center">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">Compartments</h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Open Manage Compartments modal for adding compartments
                                      setSmartBinForCompartments(smartBin);
                                      setInitialCompartmentToEdit(null);
                                      setIsCompartmentModalOpen(true);
                                    }}
                                    className="dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-600/20"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Compartment
                                  </Button>
                                </div>
                                
                                {compartments.filter(c => c.smartbin_id === smartBin.id).length === 0 ? (
                                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p className="text-sm">No compartments configured</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 dark:border-purple-600 dark:text-purple-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Open Manage Compartments modal for adding first compartment
                                        setSmartBinForCompartments(smartBin);
                                        setInitialCompartmentToEdit(null);
                                        setIsCompartmentModalOpen(true);
                                      }}
                                    >
                                      Add First Compartment
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {compartments
                                      .filter(c => c.smartbin_id === smartBin.id)
                                      .map((compartment) => (
                                        <CompartmentCard
                                          key={compartment.id}
                                          compartment={compartment}
                                          onEdit={() => {
                                            // Open CompartmentManagementModal instead of inline form
                                            setSmartBinForCompartments(smartBin);
                                            setIsCompartmentModalOpen(true);
                                            setInitialCompartmentToEdit(compartment); // Set the initial compartment to edit
                                            // The modal will handle the edit mode internally
                                          }}
                                          onDelete={() => handleDeleteCompartment(compartment.id)}
                                        />
                                      ))}
                                  </div>
                                )}
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

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

      {/* Add SmartBin Modal */}
      <ImprovedAddBinModal
        isOpen={isAddSmartBinModalOpen}
        onClose={() => setIsAddSmartBinModalOpen(false)}
        onAddBin={handleAddBin}
        binType="smart"
      />

      {/* Add SingleBin Modal */}
      <ImprovedAddBinModal
        isOpen={isAddSingleBinModalOpen}
        onClose={() => setIsAddSingleBinModalOpen(false)}
        onAddBin={handleAddBin}
        binType="single"
      />

      {/* Edit SmartBin Modal - Now uses Multi-Compartment Modal */}
      <MultiCompartmentSmartBinModal
        isOpen={isEditSmartBinModalOpen}
        onClose={() => {
          setIsEditSmartBinModalOpen(false);
          setBinToEdit(null);
        }}
        onSave={async (smartBinData) => {
          try {
            // Save the SmartBin with all compartments
            await FirebaseService.saveSmartBin(smartBinData);
            
            // Show success message
            alert(`SmartBin "${smartBinData.name}" ${binToEdit ? 'updated' : 'created'} successfully with ${smartBinData.compartments?.length || 0} compartments!`);
            
            // Reload data and close modal
            await loadData();
            setIsEditSmartBinModalOpen(false);
            setBinToEdit(null);
          } catch (error) {
            console.error('Error saving SmartBin:', error);
            alert(`Failed to save SmartBin: ${error.message}`);
          }
        }}
        existingSmartBin={binToEdit}
      />

      {/* Edit SingleBin Modal */}
      <ImprovedAddBinModal
        isOpen={isEditSingleBinModalOpen}
        onClose={() => {
          setIsEditSingleBinModalOpen(false);
          setBinToEdit(null);
        }}
        onAddBin={handleUpdateBin}
        binType="single"
        existingBin={binToEdit}
      />

      {/* Compartment Management Modal */}
      <CompartmentManagementModal
        isOpen={isCompartmentModalOpen}
        onClose={async () => {
          setIsCompartmentModalOpen(false);
          setSmartBinForCompartments(null);
          setInitialCompartmentToEdit(null); // Reset the initial compartment to edit
          // ✅ FIX: Auto-refresh data after modal closes to show newly added/edited compartments
          await loadData();
        }}
        smartBin={smartBinForCompartments}
        initialCompartment={initialCompartmentToEdit} // Pass the initial compartment to edit
        onSave={async () => {
          await loadData();
        }}
      />
    </div>
  );
}
