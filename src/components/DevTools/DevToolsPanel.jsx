import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { 
  PlayCircle, 
  Upload, 
  Trash2, 
  Settings, 
  Loader2,
  AlertCircle,
  Database,
  RefreshCw,
  Bug,
  FlaskConical,
  Wrench
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TestDataService } from '@/services/testDataService';
import { debugFirestoreData } from '@/utils/debugFirestore';
import { testBinIntegration } from '@/utils/testBinIntegration';

export default function DevToolsPanel() {
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Developer Tools</h2>
              <p className="text-gray-600 dark:text-gray-300">Manage test data and debug tools</p>
            </div>
          </div>
          {isTestMode && (
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500 px-4 py-2">
              Demo Mode Active
            </Badge>
          )}
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Enable/Disable Demo Mode */}
          <Card className="dark:bg-[#241B3A] dark:border-purple-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                {isTestMode ? (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                ) : (
                  <PlayCircle className="w-5 h-5 text-green-500" />
                )}
                Demo Mode
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                {isTestMode ? 'Stop generating test data' : 'Start continuous test data generation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={isTestMode ? handleDisableDemoMode : handleEnableDemoMode}
                disabled={isLoading}
                className={isTestMode 
                  ? "w-full bg-orange-600 hover:bg-orange-700" 
                  : "w-full bg-green-600 hover:bg-green-700"
                }
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isTestMode ? (
                  <AlertCircle className="w-4 h-4 mr-2" />
                ) : (
                  <PlayCircle className="w-4 h-4 mr-2" />
                )}
                {isTestMode ? 'Disable Demo Mode' : 'Enable Demo Mode'}
              </Button>
            </CardContent>
          </Card>

          {/* Publish to Firebase */}
          <Card className="dark:bg-[#241B3A] dark:border-purple-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Upload className="w-5 h-5 text-blue-500" />
                Publish Data
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Publish current test data to Firebase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handlePublishToFirebase}
                disabled={isLoading || !isTestMode}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Publish to Firebase
              </Button>
            </CardContent>
          </Card>

          {/* Update Sensor Data */}
          <Card className="dark:bg-[#241B3A] dark:border-purple-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <RefreshCw className="w-5 h-5 text-indigo-500" />
                Update Sensors
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Update real-time sensor data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleUpdateSensorData}
                disabled={isLoading || !isTestMode}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Update Sensor Data
              </Button>
            </CardContent>
          </Card>

          {/* Manage Test Data */}
          <Card className="dark:bg-[#241B3A] dark:border-purple-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Settings className="w-5 h-5 text-purple-500" />
                Manage Data
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Configure test data parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleManageTestData}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Test Data
              </Button>
            </CardContent>
          </Card>

          {/* Clear Test Data */}
          <Card className="dark:bg-[#241B3A] dark:border-purple-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Trash2 className="w-5 h-5 text-red-500" />
                Clear Data
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Remove all test data from system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleClearTestData}
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Test Data
              </Button>
            </CardContent>
          </Card>

          {/* Debug Firestore */}
          <Card className="dark:bg-[#241B3A] dark:border-purple-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Bug className="w-5 h-5 text-red-500" />
                Debug Firestore
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Debug Firestore data in console
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={debugFirestoreData}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Bug className="w-4 h-4 mr-2" />
                Debug Firestore Data
              </Button>
            </CardContent>
          </Card>

          {/* Test Bin Integration */}
          <Card className="dark:bg-[#241B3A] dark:border-purple-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <FlaskConical className="w-5 h-5 text-yellow-500" />
                Test Integration
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Test bin integration functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testBinIntegration}
                disabled={isLoading}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                Test Bin Integration
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

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
                  <Database className="w-4 h-4 mr-2" />
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
