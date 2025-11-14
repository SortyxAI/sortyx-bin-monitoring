import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";
import { Pen, Copy, Check, Shield, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { User } from "@/api/entities";

export default function ProfileDetails({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
    profile_photo: user.profile_photo || "",
    applicationId: user.applicationId || "",
    role: user.role || "user"
  });
  const [uploading, setUploading] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const current = await User.me();
      setCurrentUser(current);
      setIsCurrentUserAdmin(current?.role === 'admin');
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_photo: file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setFormData({
      full_name: user.full_name || "",
      phone: user.phone || "",
      profile_photo: user.profile_photo || "",
      applicationId: user.applicationId || "",
      role: user.role || "user"
    });
    setIsEditing(false);
  };

  const copyAppId = async () => {
    if (formData.applicationId || user.applicationId) {
      await navigator.clipboard.writeText(formData.applicationId || user.applicationId);
      setCopiedAppId(true);
      setTimeout(() => setCopiedAppId(false), 2000);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="dark:border-purple-600 dark:text-purple-300">
        User
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden shadow-xl border-2 border-purple-200 dark:border-purple-700 dark:bg-[#241B3A]">
      {/* Yellow gradient header matching the image */}
      <CardHeader className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 border-b-4 border-yellow-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        
        <div className="relative">
          <CardTitle className="text-xl font-bold text-gray-900">Personal Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 bg-gradient-to-br from-yellow-50 via-white to-purple-50 dark:from-yellow-950/10 dark:via-[#1a1325] dark:to-purple-950/10">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-purple-300 dark:border-purple-500 shadow-lg">
              <AvatarImage src={formData.profile_photo} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-200 via-purple-300 to-blue-200 dark:from-purple-800 dark:via-purple-700 dark:to-blue-800 text-purple-900 dark:text-purple-100 font-bold">
                {user.full_name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 bg-yellow-400 hover:bg-yellow-500 p-2 rounded-full border-2 border-white dark:border-purple-900 cursor-pointer shadow-lg transition-all hover:scale-110">
                <Pen className="w-4 h-4 text-gray-900" />
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
          {uploading && <p className="text-xs text-gray-500 mt-2">Uploading...</p>}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                placeholder="For SMS alerts"
                className="placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationId" className="flex items-center gap-2">
                Application ID
                <span className="text-xs text-gray-500 font-normal">
                  (Used for IoT device filtering)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="applicationId"
                  value={formData.applicationId}
                  onChange={(e) => setFormData(prev => ({...prev, applicationId: e.target.value}))}
                  placeholder="e.g., sortyx-app, my-app-id"
                  className="font-mono text-sm"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={copyAppId}
                  disabled={!formData.applicationId}
                  title="Copy Application ID"
                >
                  {copiedAppId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This ID is used to discover your IoT sensors with pattern: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">sensor-data-{formData.applicationId || '{appId}'}-*</code>
              </p>
            </div>
            
            {/* Role Field - Only editable for admins */}
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                Role
                {isCurrentUserAdmin && (
                  <Crown className="w-3 h-3 text-yellow-500" />
                )}
              </Label>
              {isCurrentUserAdmin ? (
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({...prev, role: value}))}
                >
                  <SelectTrigger className="dark:bg-[#1F0F2E] dark:border-purple-700 dark:text-purple-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#2A1F3D] dark:border-purple-700">
                    <SelectItem value="user" className="dark:text-purple-100">User</SelectItem>
                    <SelectItem value="admin" className="dark:text-purple-100">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  {getRoleBadge(formData.role)}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    (Only admins can change roles)
                  </span>
                </div>
              )}
              {isCurrentUserAdmin && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  As an admin, you can change user roles
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold">{user.full_name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            {user.phone && (
              <p className="text-gray-500 dark:text-gray-400">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Phone:</span> {user.phone}
              </p>
            )}
            
            {/* Display Role */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Role</p>
              <div className="flex justify-center">
                {getRoleBadge(user.role || 'user')}
              </div>
              {user.role === 'admin' && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  You have administrative privileges
                </p>
              )}
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Application ID</p>
              {user.applicationId ? (
                <div className="flex items-center justify-center gap-2">
                  <code className="text-sm font-mono bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded border border-yellow-200 dark:border-yellow-700">
                    {user.applicationId}
                  </code>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={copyAppId}
                    className="h-8 w-8"
                    title="Copy Application ID"
                  >
                    {copiedAppId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  ⚠️ Not assigned - Edit profile to set your App ID
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-yellow-50/50 dark:bg-yellow-950/10 border-t-2 border-yellow-200 dark:border-yellow-800 p-4">
        {isEditing ? (
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1 border-2 border-purple-300 dark:border-purple-600">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg font-semibold">Save Changes</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-gray-900 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/30 font-semibold">
            Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}