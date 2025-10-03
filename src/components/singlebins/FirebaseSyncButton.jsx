import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { 
  fetchAndUpdateSensorData, 
  syncAllSingleBins,
  setupRealtimeListener 
} from "./firebaseSensorSync";

export default function FirebaseSyncButton({ singleBin, onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const [listener, setListener] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    
    try {
      if (singleBin) {
        await fetchAndUpdateSensorData(singleBin.unique_id);
      } else {
        await syncAllSingleBins();
      }
      
      setSyncStatus('success');
      if (onSyncComplete) onSyncComplete();
      
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const toggleRealtimeSync = async () => {
    if (isRealtime && listener) {
      listener();
      setListener(null);
      setIsRealtime(false);
    } else {
      const unsubscribe = await setupRealtimeListener(
        singleBin.unique_id,
        (data) => {
          if (onSyncComplete) onSyncComplete();
        }
      );
      setListener(() => unsubscribe);
      setIsRealtime(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing}
        className="dark:border-purple-600 dark:text-purple-300"
      >
        <motion.div
          animate={syncing ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: syncing ? Infinity : 0, ease: "linear" }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
        </motion.div>
        {syncing ? 'Syncing...' : 'Sync Firebase'}
      </Button>

      {singleBin && (
        <Button
          variant={isRealtime ? "default" : "outline"}
          size="sm"
          onClick={toggleRealtimeSync}
          className={isRealtime ? "bg-green-600 hover:bg-green-700" : "dark:border-purple-600"}
        >
          {isRealtime ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
          {isRealtime ? 'Live' : 'Enable Live'}
        </Button>
      )}

      {syncStatus === 'success' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <Check className="w-3 h-3 mr-1" />
            Synced
          </Badge>
        </motion.div>
      )}

      {syncStatus === 'error' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        </motion.div>
      )}
    </div>
  );
}