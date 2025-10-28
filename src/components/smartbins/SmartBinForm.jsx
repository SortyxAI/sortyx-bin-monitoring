import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function SmartBinForm({ smartBin, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: smartBin?.name || "",
    description: smartBin?.description || "",
    location: smartBin?.location || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="dark:bg-[#241B3A] dark:border-purple-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="dark:text-white">
            {smartBin ? 'Edit SmartBin' : 'Create New SmartBin'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="dark:text-purple-200">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Layer 1: Bin Information</strong> - Define the basic bin details. You can add compartments after creating the bin.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-purple-100">SmartBin Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Main Office Recycling Station"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="dark:text-purple-100">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., Building A, Floor 2, Near Cafeteria"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="dark:text-purple-100">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of this SmartBin (e.g., 'Multi-compartment recycling station for office waste')"
                  rows={3}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                💡 After creating the SmartBin, you can add compartments with specific IoT devices, bin types, and sensor configurations.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-purple-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="dark:border-purple-600 dark:text-purple-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
              >
                {smartBin ? 'Update SmartBin' : 'Create SmartBin'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}