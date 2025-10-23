import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, AlertCircle, Crown, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "@/api/entities";

export default function AddUserDialog({ open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user",
    subscription_plan: "basic",
    phone: "",
    applicationId :"",
    status: "active",
    subscription_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    profile_photo: "",
    notifications_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [canEditRoles, setCanEditRoles] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      // Check if current user can edit roles
      setCanEditRoles(user.subscription_plan === 'premium' || user.subscription_plan === 'enterprise');
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user makes changes
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    return true;
  };


  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Prepare user data - exclude role if user can't set roles
      const userData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        applicationId: formData.applicationId,
        profile_photo: formData.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name)}&background=7c3aed&color=fff`,
        subscription_plan: formData.subscription_plan,
        subscription_expiry: formData.subscription_expiry,
        status: formData.status,
        notifications_enabled: formData.notifications_enabled
      };

      // Only include role if user has permission to set roles, otherwise default to 'user'
      userData.role = canEditRoles ? formData.role : 'user';

      await onSave(userData);
   
      // Reset form on success
      setFormData({
        full_name: "",
        email: "",
        role: "user",
        subscription_plan: "basic",
        phone: "",
        status: "active",
        subscription_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        profile_photo: "",
        notifications_enabled: true
      });
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Handle specific error types
      if (error.message.includes("Only paid users can update user roles")) {
        setError("Role assignment requires a premium subscription. User will be created with 'User' role.");
      } else if (error.message.includes("403") || error.message.includes("permission")) {
        setError("You don't have permission to create users. Please contact your administrator.");
      } else if (error.message.includes("email") && error.message.includes("exists")) {
        setError("A user with this email address already exists.");
      } else if (error.message.includes("validation")) {
        setError("Please check all required fields and try again.");
      } else {
        setError(error.message || "Failed to create user. Note: User creation might require special admin privileges.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: "",
      email: "",
      role: "user",
      subscription_plan: "basic",
      phone: "",
      status: "active",
      subscription_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      profile_photo: "",
      notifications_enabled: true
    });
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-[#241B3A] dark:border-purple-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <UserPlus className="w-5 h-5 text-purple-600" />
            Add New User
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert className="border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Warning */}
        {!canEditRoles && (
          <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
            <Crown className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <span className="font-semibold">Note:</span> Users will be created with 'User' role. Premium subscription required for admin role assignment.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-purple-700 pb-2">
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="dark:text-gray-200">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="John Doe"
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-200">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="dark:text-gray-200">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1234567890"
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>

                {/* Application Id */}
              <div className="space-y-2">
                <Label htmlFor="applicationId" className="dark:text-gray-200">Application ID</Label>
                <span className="text-red-500">*</span>
                <Input
                   id="applicationId"
                   value={formData.applicationId}
                   onChange={(e) => handleChange('applicationId', e.target.value)}
                   placeholder="Your Sensor Application ID Eg..: smart-bin123"
                   className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profile_photo" className="dark:text-gray-200">Profile Photo URL</Label>
                <Input
                  id="profile_photo"
                  value={formData.profile_photo}
                  onChange={(e) => handleChange('profile_photo', e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-purple-700 pb-2">
              Account Settings
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="dark:text-gray-200 flex items-center gap-2">
                  User Role
                  {!canEditRoles && <Lock className="w-3 h-3 text-gray-400" />}
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleChange('role', value)}
                  disabled={!canEditRoles}
                >
                  <SelectTrigger className={`dark:bg-[#1F1235] dark:border-purple-600 dark:text-white ${!canEditRoles ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="user" className="dark:text-gray-200">User</SelectItem>
                    <SelectItem value="admin" className="dark:text-gray-200">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {!canEditRoles && ( 
                  <p className="text-xs text-gray-500 dark:text-gray-400">Will be set to 'User' - premium required for admin</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="dark:text-gray-200">Account Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="active" className="dark:text-gray-200">Active</SelectItem>
                    <SelectItem value="suspended" className="dark:text-gray-200">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscription_plan" className="dark:text-gray-200">Subscription Plan</Label>
                <Select value={formData.subscription_plan} onValueChange={(value) => handleChange('subscription_plan', value)}>
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="basic" className="dark:text-gray-200">Basic</SelectItem>
                    <SelectItem value="premium" className="dark:text-gray-200">Premium</SelectItem>
                    <SelectItem value="enterprise" className="dark:text-gray-200">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subscription_expiry" className="dark:text-gray-200">Subscription Expiry</Label>
                <Input
                  id="subscription_expiry"
                  type="date"
                  value={formData.subscription_expiry}
                  onChange={(e) => handleChange('subscription_expiry', e.target.value)}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} className="dark:border-purple-600 dark:text-gray-300">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !formData.full_name || !formData.email || !formData.phone}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}