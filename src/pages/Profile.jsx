import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import ProfileDetails from "../components/profile/ProfileDetails";
import SubscriptionInfo from "../components/profile/SubscriptionInfo";
import NotificationPreferences from "../components/profile/NotificationPreferences";
import UsageStats from "../components/profile/UsageStats";
import IotDevicesManager from "../components/profile/IotDevicesManager";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await User.updateMyUserData(data);
      loadUser(); // Reload to show updated data
      // Add a success toast notification here in a real app
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-16">Loading profile...</div>;
  }

  if (!user) {
    return <div className="text-center py-16">Could not load user profile. Please try logging in again.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-300">Manage your account settings and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <ProfileDetails user={user} onUpdate={handleUpdate} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          <IotDevicesManager user={user} onUpdate={handleUpdate} />
          <SubscriptionInfo user={user} />
          <NotificationPreferences user={user} onUpdate={handleUpdate} />
          <UsageStats />
        </div>
      </div>
    </div>
  );
}