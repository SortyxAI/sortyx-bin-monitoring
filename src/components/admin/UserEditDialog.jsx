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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Crown, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "@/api/entities";

export default function UserEditDialog({ user, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    email: user.email || "",
    phone: user.phone || "",
    profile_photo: user.profile_photo || "",
    role: user.role || 'user',
    subscription_plan: user.subscription_plan || 'basic',
    subscription_expiry: user.subscription_expiry || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    status: user.status || 'active',
    notifications_enabled: user.notifications_enabled ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // ✅ Changed from canEditRoles

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      // ✅ Check if current user is admin (not based on subscription)
      setIsAdmin(user.role === 'admin');
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user makes changes
  };

  const validateForm = () => {
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
      // Prepare update data - exclude role if user can't edit roles
      const updateData = {
        phone: formData.phone,
        profile_photo: formData.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=7c3aed&color=fff`,
        subscription_plan: formData.subscription_plan,
        subscription_expiry: formData.subscription_expiry,
        status: formData.status,
        notifications_enabled: formData.notifications_enabled
      };

      // Only include role if user has permission to edit roles
      if (isAdmin) {
        updateData.role = formData.role;
      }

      await onSave(user.id, updateData);
    } catch (error) {
      console.error("Error updating user:", error);
      
      // Handle specific error types
      if (error.message.includes("Only paid users can update user roles")) {
        setError("Role updates require a premium subscription. Please upgrade to modify user roles.");
      } else if (error.message.includes("403") || error.message.includes("permission")) {
        setError("You don't have permission to update this user. Please contact your administrator.");
      } else if (error.message.includes("validation")) {
        setError("Please check all required fields and try again.");
      } else {
        setError(error.message || "Failed to update user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-[#241B3A] dark:border-purple-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Edit User</DialogTitle>
          <div className="flex items-center gap-4 pt-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={formData.profile_photo} />
              <AvatarFallback className="text-2xl bg-purple-200 dark:bg-purple-700">
                {formData.full_name?.[0] || formData.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg dark:text-white">{formData.full_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email}</p>
            </div>
          </div>
        </DialogHeader>
        
        {error && (
          <Alert className="border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ REMOVED: Premium subscription warning - admins can edit roles regardless of subscription */}
        
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-purple-700 pb-2">
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="dark:text-gray-200">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  disabled
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Name is managed by the authentication system</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-200">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  disabled
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
                  {!isAdmin && <Lock className="w-3 h-3 text-gray-400" />}
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleChange('role', value)}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className={`dark:bg-[#1F1235] dark:border-purple-600 dark:text-white ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="user" className="dark:text-gray-200">User</SelectItem>
                    <SelectItem value="admin" className="dark:text-gray-200">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {/* ✅ Updated message - only admins can edit roles, not subscription-based */}
                {isAdmin ? (
                  <p className="text-xs text-green-600 dark:text-green-400">✓ You can change user roles as an admin</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Only admins can change user roles</p>
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

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1F1235] rounded-lg">
              <div>
                <Label className="dark:text-gray-200">Email Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive email alerts and notifications</p>
              </div>
              <Switch
                checked={formData.notifications_enabled}
                onCheckedChange={(checked) => handleChange('notifications_enabled', checked)}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:border-purple-600 dark:text-gray-300">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}