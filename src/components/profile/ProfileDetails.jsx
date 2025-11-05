import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadFile } from "@/api/integrations";
import { Pen, Copy, Check } from "lucide-react";

export default function ProfileDetails({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
    profile_photo: user.profile_photo || "",
    applicationId: user.applicationId || ""
  });
  const [uploading, setUploading] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState(false);
  
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
      applicationId: user.applicationId || ""
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.profile_photo} />
              <AvatarFallback className="text-3xl bg-purple-200">
                {user.full_name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border cursor-pointer">
                <Pen className="w-4 h-4 text-gray-600" />
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
      <CardFooter>
        {isEditing ? (
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700">Save Changes</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
            Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}