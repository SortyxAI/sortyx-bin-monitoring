import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadFile } from "@/api/integrations";
import { Pen } from "lucide-react";

export default function ProfileDetails({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
    profile_photo: user.profile_photo || "",
    applicationId: user.applicationId || ""
  });
  const [uploading, setUploading] = useState(false);
  
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
  console.log("Users!!!!!!!!!!!!", user);
  
  const handleCancel = () => {
    setFormData({
      full_name: user.full_name || "",
      phone: user.phone || "",
      profile_photo: user.profile_photo || ""
    });
    setIsEditing(false);
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                placeholder="For SMS alerts"
                className="placeholder:text-gray-950"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold">{user.full_name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-gray-500">{user.phone || "No phone number set"}</p>
            <p className="text-gray-500"> <span className="text-gray-900 dark:text-[#FFFF00]">App Id:</span> {user.applicationId || "Not assigned"}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isEditing ? (
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700">Save</Button>
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