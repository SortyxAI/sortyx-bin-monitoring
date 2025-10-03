import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Bell, Trash2, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddBinModal from "@/components/modals/AddBinModal";
import { FirebaseService } from "@/services/firebaseService";

export default function QuickActions() {
  const [isAddSmartBinModalOpen, setIsAddSmartBinModalOpen] = useState(false);
  const [isAddSingleBinModalOpen, setIsAddSingleBinModalOpen] = useState(false);

  const handleAddBin = async (binData) => {
    try {
      console.log('Adding new bin:', binData);
      
      // Save to Firebase based on bin type
      let savedBin;
      if (binData.type === 'smartbin') {
        savedBin = await FirebaseService.saveSmartBin(binData);
      } else {
        savedBin = await FirebaseService.saveSingleBin(binData);
      }
      
      console.log('Bin saved successfully:', savedBin);
      
      // Show success message
      alert(`${binData.type === 'smartbin' ? 'SmartBin' : 'SingleBin'} "${binData.name}" added successfully with IoT device "${binData.deviceId}"!\n\nBin ID: ${savedBin.firebaseId}`);
      
      // Trigger a page refresh to show the new bin in the dashboard
      window.location.reload();
      
    } catch (error) {
      console.error('Error adding bin:', error);
      alert(`Failed to add bin: ${error.message}`);
      throw error; // Let the modal handle the error display
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-center">
        {/* Smart Bin - Now opens modal instead of navigation */}
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setIsAddSmartBinModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add SmartBin
        </Button>

        {/* Single Bin - New option for basic bins */}
        <Button 
          variant="outline" 
          className="border-green-500 text-green-600 hover:bg-green-50"
          onClick={() => setIsAddSingleBinModalOpen(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Add SingleBin
        </Button>

        {/* Keep existing alerts link */}
        <Link to={createPageUrl("Alerts")}>
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            View Alerts
          </Button>
        </Link>

        {/* Optional: Add more quick actions */}
        <Link to={createPageUrl("Reports")}>
          <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
        </Link>
      </div>

      {/* Add SmartBin Modal */}
      <AddBinModal
        isOpen={isAddSmartBinModalOpen}
        onClose={() => setIsAddSmartBinModalOpen(false)}
        onAddBin={handleAddBin}
        binType="smartbin"
      />

      {/* Add SingleBin Modal */}
      <AddBinModal
        isOpen={isAddSingleBinModalOpen}
        onClose={() => setIsAddSingleBinModalOpen(false)}
        onAddBin={handleAddBin}
        binType="singlebin"
      />
    </>
  );
}