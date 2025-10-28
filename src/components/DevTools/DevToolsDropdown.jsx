import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Wrench, 
  PlayCircle, 
  Upload, 
  Trash2, 
  Settings, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TestDataService } from '@/services/testDataService';

export default function DevToolsDropdown() {
  const { toast } = useToast();
  const [isTestMode, setIsTestMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [fillLevelConfig, setFillLevelConfig] = useState({
    maxFillLevel: 100,
    numSmartBins: 5,
    numSingleBins: 10,
  });

  useEffect(() => {
    // Check if test mode is enabled
    const testModeEnabled = TestDataService.isTestModeEnabled();
    setIsTestMode(testModeEnabled);
  }, []);

  const handleEnableDemoMode = async () => {
    setIsLoading(true);
    try {
      const result = await TestDataService.startDemoModeWithFirebase();
      
      if (result.success) {
        setIsTestMode(true);
        toast({
          title: "✅ Demo Mode Enabled",
          description: "Test data is now being published to Firebase. Dashboard will update automatically.",
          duration: 5000,
        });
        
        // Reload page to show test data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error(result.message || 'Failed to enable demo mode');
      }
    } catch (error) {
      console.error('Error enabling demo mode:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to enable demo mode",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableDemoMode = () => {
    TestDataService.stopDemoMode();
    setIsTestMode(false);
    toast({
      title: "🛑 Demo Mode Disabled",
      description: "Test data generation stopped. Page will reload.",
      duration: 3000,
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handlePublishToFirebase = async () => {
    setIsLoading(true);
    try {
      const result = await TestDataService.publishTestDataToFirebase();
      
      if (result.success) {
        toast({
          title: "✅ Published to Firebase",
          description: result.message || "Test data successfully published",
          duration: 5000,
        });
        
        // Refresh dashboard
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error(result.error || 'Failed to publish data');
      }
    } catch (error) {
      console.error('Error publishing to Firebase:', error);
      toast({
        title: "❌ Publish Failed",
        description: error.message || "Could not publish data to Firebase",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTestData = async () => {
    if (!confirm('⚠️ This will clear ALL test data from Firebase and localStorage. Continue?')) {
      return;
    }

    setIsLoading(true);
    try {
      // Stop demo mode if running
      if (isTestMode) {
        TestDataService.stopDemoMode();
      }

      // Clear from localStorage
      TestDataService.clearTestData();
      
      // Clear from Firebase
      await TestDataService.clearTestDataFromFirebase();
      
      setIsTestMode(false);
      toast({
        title: "🗑️ Test Data Cleared",
        description: "All test data removed from Firebase and localStorage",
        duration: 3000,
      });
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error clearing test data:', error);
      toast({
        title: "❌ Clear Failed",
        description: error.message || "Could not clear test data",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageTestData = () => {
    setShowManageDialog(true);
  };

  const handleGenerateCustomData = async () => {
    setIsLoading(true);
    try {
      // Update TestDataService with custom fill level range
      const customOptions = {
        numSmartBins: fillLevelConfig.numSmartBins,
        numSingleBins: fillLevelConfig.numSingleBins,
        maxFillLevel: fillLevelConfig.maxFillLevel,
      };

      const result = await TestDataService.generateAndPublishTestData(customOptions);
      
      if (result.success) {
        setShowManageDialog(false);
        toast({
          title: "✅ Custom Test Data Generated",
          description: `Generated ${result.publishResults.smartBins.length} SmartBins and ${result.publishResults.singleBins.length} SingleBins with fill levels 0-${fillLevelConfig.maxFillLevel}%`,
          duration: 5000,
        });
        
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error('Failed to generate custom data');
      }
    } catch (error) {
      console.error('Error generating custom data:', error);
      toast({
        title: "❌ Generation Failed",
        description: error.message || "Could not generate custom test data",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSensorData = async () => {
    setIsLoading(true);
    try {
      await TestDataService.updateSensorDataContinuously();
      toast({
        title: "🔄 Sensor Data Updated",
        description: "Real-time sensor data published to Firebase",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating sensor data:', error);
      toast({
        title: "❌ Update Failed",
        description: error.message || "Could not update sensor data",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-purple-200 hover:text-purple-700 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-500/20 flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            <span>DevTools</span>
            {isTestMode && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-64 dark:bg-[#2A1F3D] dark:border-purple-700"
        >
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Developer Tools
            </span>
            {isTestMode && (
              <Badge variant="outline" className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500">
                Active
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="dark:bg-purple-700" />

          {/* Enable/Disable Demo Mode */}
          <DropdownMenuItem 
            onClick={isTestMode ? handleDisableDemoMode : handleEnableDemoMode}
            disabled={isLoading}
            className="dark:text-purple-100 dark:hover:bg-purple-500/20 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isTestMode ? (
              <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2 text-green-500" />
            )}
            {isTestMode ? 'Disable Demo Mode' : 'Enable Demo Mode'}
          </DropdownMenuItem>

          {/* Publish to Firebase */}
          <DropdownMenuItem 
            onClick={handlePublishToFirebase}
            disabled={isLoading || !isTestMode}
            className="dark:text-purple-100 dark:hover:bg-purple-500/20 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2 text-blue-500" />
            )}
            Publish to Firebase
          </DropdownMenuItem>

          {/* Update Sensor Data */}
          <DropdownMenuItem 
            onClick={handleUpdateSensorData}
            disabled={isLoading || !isTestMode}
            className="dark:text-purple-100 dark:hover:bg-purple-500/20 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2 text-indigo-500" />
            )}
            Update Sensor Data
          </DropdownMenuItem>

          <DropdownMenuSeparator className="dark:bg-purple-700" />

          {/* Manage Test Data */}
          <DropdownMenuItem 
            onClick={handleManageTestData}
            disabled={isLoading}
            className="dark:text-purple-100 dark:hover:bg-purple-500/20 cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2 text-purple-500" />
            Manage Test Data
          </DropdownMenuItem>

          {/* Clear Test Data */}
          <DropdownMenuItem 
            onClick={handleClearTestData}
            disabled={isLoading}
            className="dark:text-purple-100 dark:hover:bg-purple-500/20 cursor-pointer text-red-600 dark:text-red-400"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Clear Test Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Manage Test Data Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="dark:bg-[#2A1F3D] dark:border-purple-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              Manage Test Data Configuration
            </DialogTitle>
            <DialogDescription className="dark:text-purple-200/70">
              Configure the parameters for generating test data. Fill levels will be randomly generated between 0 and your max value.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Max Fill Level */}
            <div className="space-y-2">
              <Label htmlFor="maxFillLevel" className="dark:text-purple-100">
                Maximum Fill Level (0-100%)
              </Label>
              <Input
                id="maxFillLevel"
                type="number"
                min="0"
                max="100"
                value={fillLevelConfig.maxFillLevel}
                onChange={(e) => setFillLevelConfig({
                  ...fillLevelConfig,
                  maxFillLevel: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                })}
                className="dark:bg-[#1F0F2E] dark:border-purple-700 dark:text-purple-100"
              />
              <p className="text-xs text-gray-500 dark:text-purple-200/50">
                Test bins will have random fill levels from 0% to {fillLevelConfig.maxFillLevel}%
              </p>
            </div>

            {/* Number of SmartBins */}
            <div className="space-y-2">
              <Label htmlFor="numSmartBins" className="dark:text-purple-100">
                Number of SmartBins
              </Label>
              <Input
                id="numSmartBins"
                type="number"
                min="0"
                max="20"
                value={fillLevelConfig.numSmartBins}
                onChange={(e) => setFillLevelConfig({
                  ...fillLevelConfig,
                  numSmartBins: Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
                })}
                className="dark:bg-[#1F0F2E] dark:border-purple-700 dark:text-purple-100"
              />
            </div>

            {/* Number of SingleBins */}
            <div className="space-y-2">
              <Label htmlFor="numSingleBins" className="dark:text-purple-100">
                Number of SingleBins
              </Label>
              <Input
                id="numSingleBins"
                type="number"
                min="0"
                max="50"
                value={fillLevelConfig.numSingleBins}
                onChange={(e) => setFillLevelConfig({
                  ...fillLevelConfig,
                  numSingleBins: Math.min(50, Math.max(0, parseInt(e.target.value) || 0))
                })}
                className="dark:bg-[#1F0F2E] dark:border-purple-700 dark:text-purple-100"
              />
            </div>

            {/* Summary */}
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                Summary:
              </p>
              <ul className="text-xs text-purple-700 dark:text-purple-200 space-y-1">
                <li>• {fillLevelConfig.numSmartBins} SmartBins with 3-4 compartments each</li>
                <li>• {fillLevelConfig.numSingleBins} SingleBins</li>
                <li>• Fill levels: 0-{fillLevelConfig.maxFillLevel}% (random)</li>
                <li>• All with real-time sensor data in Firebase</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowManageDialog(false)}
              disabled={isLoading}
              className="dark:border-purple-700 dark:text-purple-100 dark:hover:bg-purple-500/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateCustomData}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Generate & Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
