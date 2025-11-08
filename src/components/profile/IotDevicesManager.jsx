import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Cpu, 
  AlertCircle,
  Info,
  CheckCircle2,
  Search,
  Filter,
  Sparkles
} from "lucide-react";

export default function IotDevicesManager({ user, onUpdate }) {
  const [devices, setDevices] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ type: "", name: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest', 'oldest', 'name', 'type'

  useEffect(() => {
    // Load devices from user data
    if (user?.iot_devices) {
      setDevices(user.iot_devices);
    }
  }, [user]);

  const resetForm = () => {
    setFormData({ type: "", name: "" });
    setIsAdding(false);
    setEditingId(null);
    setError("");
  };

  const validateForm = () => {
    if (!formData.type.trim()) {
      setError("Device type is required");
      return false;
    }
    if (!formData.name.trim()) {
      setError("Device name is required");
      return false;
    }
    
    // Check for duplicate names
    const isDuplicate = devices.some(
      device => device.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      device.id !== editingId
    );
    
    if (isDuplicate) {
      setError("A device with this name already exists");
      return false;
    }
    
    return true;
  };

  const handleAdd = async () => {
    setError("");
    setSuccess("");
    
    if (!validateForm()) return;

    const newDevice = {
      id: Date.now().toString(),
      type: formData.type.trim(),
      name: formData.name.trim(),
      created_at: new Date().toISOString()
    };

    const updatedDevices = [...devices, newDevice];
    setDevices(updatedDevices);

    try {
      await onUpdate({ iot_devices: updatedDevices });
      setSuccess("Device added successfully!");
      setTimeout(() => setSuccess(""), 3000);
      resetForm();
    } catch (err) {
      setError("Failed to save device. Please try again.");
      console.error("Error adding device:", err);
    }
  };

  const handleEdit = (device) => {
    setFormData({ type: device.type, name: device.name });
    setEditingId(device.id);
    setIsAdding(false);
    setError("");
    setSuccess("");
  };

  const handleUpdate = async () => {
    setError("");
    setSuccess("");
    
    if (!validateForm()) return;

    const updatedDevices = devices.map(device =>
      device.id === editingId
        ? { 
            ...device, 
            type: formData.type.trim(), 
            name: formData.name.trim(),
            updated_at: new Date().toISOString()
          }
        : device
    );

    setDevices(updatedDevices);

    try {
      await onUpdate({ iot_devices: updatedDevices });
      setSuccess("Device updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      resetForm();
    } catch (err) {
      setError("Failed to update device. Please try again.");
      console.error("Error updating device:", err);
    }
  };

  const handleDelete = async (deviceId) => {
    const updatedDevices = devices.filter(device => device.id !== deviceId);
    setDevices(updatedDevices);

    try {
      await onUpdate({ iot_devices: updatedDevices });
      setSuccess("Device deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete device. Please try again.");
      console.error("Error deleting device:", err);
      // Revert on error
      setDevices(devices);
    }
  };

  // Get unique device types for filtering
  const deviceTypes = ["all", ...new Set(devices.map(d => d.type))];

  // Filter and sort devices
  const getFilteredAndSortedDevices = () => {
    let filtered = devices;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(device => device.type === filterType);
    }

    // Apply sorting
    switch (sortOrder) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "type":
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredDevices = getFilteredAndSortedDevices();

  // Get device type color with gradient
  const getTypeColor = (type) => {
    const colors = [
      { bg: "from-blue-500 to-blue-600", border: "border-blue-400", text: "text-blue-700", light: "bg-blue-50" },
      { bg: "from-green-500 to-green-600", border: "border-green-400", text: "text-green-700", light: "bg-green-50" },
      { bg: "from-purple-500 to-purple-600", border: "border-purple-400", text: "text-purple-700", light: "bg-purple-50" },
      { bg: "from-orange-500 to-orange-600", border: "border-orange-400", text: "text-orange-700", light: "bg-orange-50" },
      { bg: "from-pink-500 to-pink-600", border: "border-pink-400", text: "text-pink-700", light: "bg-pink-50" },
      { bg: "from-teal-500 to-teal-600", border: "border-teal-400", text: "text-teal-700", light: "bg-teal-50" },
      { bg: "from-indigo-500 to-indigo-600", border: "border-indigo-400", text: "text-indigo-700", light: "bg-indigo-50" },
      { bg: "from-red-500 to-red-600", border: "border-red-400", text: "text-red-700", light: "bg-red-50" },
      { bg: "from-yellow-500 to-yellow-600", border: "border-yellow-400", text: "text-yellow-700", light: "bg-yellow-50" },
      { bg: "from-cyan-500 to-cyan-600", border: "border-cyan-400", text: "text-cyan-700", light: "bg-cyan-50" }
    ];
    const hash = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Card className="overflow-hidden shadow-xl dark:bg-[#241B3A] dark:border-purple-700">
      {/* Fancy Header with Gradient */}
      <CardHeader className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white border-b-4 border-purple-300 dark:border-purple-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/30">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                IoT Devices Management
                <Badge variant="secondary" className="bg-white/90 text-purple-700 font-semibold shadow-md">
                  {devices.length} Device{devices.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1.5 text-purple-100">
                Manage IoT devices with ease
              </CardDescription>
            </div>
          </div>
          {!isAdding && !editingId && (
            <Button
              onClick={() => {
                setIsAdding(true);
                setError("");
                setSuccess("");
              }}
              className="bg-white text-purple-700 hover:bg-purple-50 shadow-lg font-semibold border-2 border-white/50"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Device
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1325] dark:to-[#241B3A]">
        {/* Compact Pattern Note */}
        <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 dark:border-blue-600 py-2.5 shadow-sm">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          <div className="ml-2 text-xs text-blue-800 dark:text-blue-100">
            <strong>Collection Pattern:</strong> <code className="bg-white/60 dark:bg-black/50 px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-600">sensor-data-{'{deviceName}'}</code> | Match Firestore collection names exactly
          </div>
        </Alert>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 dark:border-green-600 py-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-300" />
                <span className="ml-2 text-xs text-green-800 dark:text-green-100 font-medium">{success}</span>
              </Alert>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="border-red-300 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/40 dark:to-pink-950/40 dark:border-red-600 py-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-300" />
                <span className="ml-2 text-xs text-red-800 dark:text-red-100 font-medium">{error}</span>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {(isAdding || editingId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-2 border-purple-300 dark:border-purple-500 rounded-xl p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 shadow-lg"
            >
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Edit Device</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Add New Device</span>
                  </>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="deviceType" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Device Type *
                  </Label>
                  <Input
                    id="deviceType"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="Temperature, Ultrasonic, Weight..."
                    className="h-9 text-sm border-2 focus:border-purple-400 dark:bg-gray-800 dark:border-purple-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deviceName" className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Device Name * <span className="text-gray-500 dark:text-gray-400 font-normal">(collection name)</span>
                  </Label>
                  <Input
                    id="deviceName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="temp-01, ultrasonic-bin-1..."
                    className="h-9 text-sm font-mono border-2 focus:border-purple-400 dark:bg-gray-800 dark:border-purple-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={editingId ? handleUpdate : handleAdd}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md font-semibold h-9"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {editingId ? "Update Device" : "Add Device"}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 h-9 border-2 font-semibold dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/30"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Controls */}
        {devices.length > 0 && (
          <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 shadow-md border-2 border-gray-200 dark:border-purple-700/50">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm border-2 focus:border-purple-400 dark:bg-gray-800 dark:border-purple-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-9 text-sm px-3 border-2 rounded-md bg-white dark:bg-gray-800 focus:border-purple-400 dark:border-purple-600 dark:text-white font-medium"
              >
                {deviceTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "all" ? "🔍 All Types" : `📡 ${type}`}
                  </option>
                ))}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-9 text-sm px-3 border-2 rounded-md bg-white dark:bg-gray-800 focus:border-purple-400 dark:border-purple-600 dark:text-white font-medium"
              >
                <option value="newest">⬇️ Newest First</option>
                <option value="oldest">⬆️ Oldest First</option>
                <option value="name">🔤 Name A-Z</option>
                <option value="type">📋 Type A-Z</option>
              </select>
            </div>
          </div>
        )}

        {/* Devices List - Line by Line */}
        <div className="relative">
          {devices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-600"
            >
              <div className="inline-block p-5 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-2xl mb-4 shadow-lg">
                <Cpu className="w-14 h-14 text-purple-600 dark:text-purple-300" />
              </div>
              <p className="text-base font-semibold text-gray-700 dark:text-gray-200">No devices added yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click "Add Device" to start monitoring your sensors</p>
            </motion.div>
          ) : filteredDevices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600"
            >
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No devices match your search</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters</p>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-gray-900/50 rounded-xl shadow-lg border-2 border-gray-200 dark:border-purple-700/50 overflow-hidden">
              {/* List Header */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-purple-900/30 dark:to-blue-900/30 border-b-2 border-gray-200 dark:border-purple-700/50 px-4 py-2.5 flex items-center gap-3 text-xs font-bold text-gray-700 dark:text-gray-200">
                <div className="w-10 text-center">#</div>
                <div className="w-10"></div>
                <div className="flex-1">DEVICE NAME</div>
                <div className="w-32 sm:w-40">TYPE</div>
                <div className="w-20 text-center">ACTIONS</div>
              </div>

              {/* Scrollable Device List */}
              <ScrollArea className="h-[450px]">
                <AnimatePresence>
                  {filteredDevices.map((device, index) => {
                    const typeColors = getTypeColor(device.type);
                    const isEditing = editingId === device.id;
                    
                    // Generate a mild gradient for each row based on index
                    const rowGradients = [
                      "bg-gradient-to-r from-purple-50/30 via-white to-blue-50/30 dark:from-purple-900/20 dark:via-gray-900/50 dark:to-blue-900/20",
                      "bg-gradient-to-r from-blue-50/30 via-white to-cyan-50/30 dark:from-blue-900/20 dark:via-gray-900/50 dark:to-cyan-900/20",
                      "bg-gradient-to-r from-green-50/30 via-white to-emerald-50/30 dark:from-green-900/20 dark:via-gray-900/50 dark:to-emerald-900/20",
                      "bg-gradient-to-r from-orange-50/30 via-white to-yellow-50/30 dark:from-orange-900/20 dark:via-gray-900/50 dark:to-yellow-900/20",
                      "bg-gradient-to-r from-pink-50/30 via-white to-rose-50/30 dark:from-pink-900/20 dark:via-gray-900/50 dark:to-rose-900/20",
                      "bg-gradient-to-r from-indigo-50/30 via-white to-purple-50/30 dark:from-indigo-900/20 dark:via-gray-900/50 dark:to-purple-900/20",
                      "bg-gradient-to-r from-teal-50/30 via-white to-cyan-50/30 dark:from-teal-900/20 dark:via-gray-900/50 dark:to-cyan-900/20",
                      "bg-gradient-to-r from-violet-50/30 via-white to-fuchsia-50/30 dark:from-violet-900/20 dark:via-gray-900/50 dark:to-fuchsia-900/20"
                    ];
                    const rowGradient = rowGradients[index % rowGradients.length];
                    
                    return (
                      <motion.div
                        key={device.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.015 }}
                        className={`group flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-purple-900/30 transition-all ${
                          isEditing
                            ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 shadow-inner border-l-4 border-l-purple-500 dark:border-l-purple-400"
                            : `${rowGradient} hover:shadow-md`
                        }`}
                      >
                        {/* Index Number */}
                        <div className="w-10 text-center">
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                            {index + 1}
                          </span>
                        </div>

                        {/* Color Icon */}
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColors.bg} flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <Cpu className="w-5 h-5 text-white" />
                        </div>

                        {/* Device Name - Full Width */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 truncate" title={device.name}>
                            {device.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            sensor-data-{device.name}
                          </p>
                        </div>

                        {/* Device Type Badge */}
                        <div className="w-32 sm:w-40">
                          <Badge 
                            className={`${typeColors.light} ${typeColors.text} dark:bg-gradient-to-r dark:from-purple-800/60 dark:to-blue-800/60 dark:text-purple-200 dark:border-purple-500 border ${typeColors.border} font-semibold text-xs px-2.5 py-1 shadow-sm`}
                          >
                            {device.type}
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="w-20 flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(device)}
                            disabled={isAdding || (editingId !== null && editingId !== device.id)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all hover:scale-110 disabled:opacity-30"
                            title="Edit device"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`🗑️ Delete "${device.name}"?\n\nThis action cannot be undone.`)) {
                                handleDelete(device.id);
                              }
                            }}
                            disabled={isAdding || editingId !== null}
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all hover:scale-110 disabled:opacity-30"
                            title="Delete device"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Fancy Stats Footer */}
        {devices.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 rounded-lg p-3 border-2 border-purple-200 dark:border-purple-600 shadow-md">
            <div className="flex items-center justify-center text-xs">
              <div className="flex items-center gap-4 font-semibold text-gray-700 dark:text-gray-200">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Showing <strong className="text-purple-700 dark:text-purple-300">{filteredDevices.length}</strong> of <strong className="text-blue-700 dark:text-blue-300">{devices.length}</strong> devices
                </span>
                {deviceTypes.length > 2 && (
                  <span className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <strong className="text-indigo-700 dark:text-indigo-300">{deviceTypes.length - 1}</strong> types
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
