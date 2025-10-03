import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, Upload, Globe, Database, Bell, Shield } from "lucide-react";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    app_name: "Sortyx SmartBin",
    app_description: "Smart Waste Management System",
    company_name: "Sortyx Ventures Pvt Ltd",
    company_logo: "",
    timezone: "UTC",
    currency: "USD",
    language: "en",
    max_smartbins_per_user: 50,
    max_compartments_per_smartbin: 10,
    data_retention_days: 365,
    enable_notifications: true,
    enable_email_alerts: true,
    enable_sms_alerts: true,
    alert_cooldown_minutes: 60,
    maintenance_mode: false,
    api_rate_limit: 1000,
    session_timeout_hours: 24,
    password_min_length: 8,
    require_2fa: false
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to a system settings entity
      console.log("Saving system settings:", settings);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Configure application-wide parameters and preferences</p>
      </motion.div>

      <div className="space-y-8">
        {/* General Settings */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Globe className="w-5 h-5 text-blue-600" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Application Name</Label>
                <Input
                  value={settings.app_name}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Company Name</Label>
                <Input
                  value={settings.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-200">Application Description</Label>
              <Textarea
                value={settings.app_description}
                onChange={(e) => handleChange('app_description', e.target.value)}
                rows={3}
                className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => handleChange('timezone', value)}>
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="UTC" className="dark:text-gray-200">UTC</SelectItem>
                    <SelectItem value="EST" className="dark:text-gray-200">EST</SelectItem>
                    <SelectItem value="PST" className="dark:text-gray-200">PST</SelectItem>
                    <SelectItem value="IST" className="dark:text-gray-200">IST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => handleChange('currency', value)}>
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="USD" className="dark:text-gray-200">USD</SelectItem>
                    <SelectItem value="EUR" className="dark:text-gray-200">EUR</SelectItem>
                    <SelectItem value="GBP" className="dark:text-gray-200">GBP</SelectItem>
                    <SelectItem value="INR" className="dark:text-gray-200">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Language</Label>
                <Select value={settings.language} onValueChange={(value) => handleChange('language', value)}>
                  <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                    <SelectItem value="en" className="dark:text-gray-200">English</SelectItem>
                    <SelectItem value="es" className="dark:text-gray-200">Spanish</SelectItem>
                    <SelectItem value="fr" className="dark:text-gray-200">French</SelectItem>
                    <SelectItem value="de" className="dark:text-gray-200">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Limits */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Database className="w-5 h-5 text-green-600" />
              System Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Max SmartBins per User</Label>
                <Input
                  type="number"
                  value={settings.max_smartbins_per_user}
                  onChange={(e) => handleChange('max_smartbins_per_user', Number(e.target.value))}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Max Compartments per SmartBin</Label>
                <Input
                  type="number"
                  value={settings.max_compartments_per_smartbin}
                  onChange={(e) => handleChange('max_compartments_per_smartbin', Number(e.target.value))}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Data Retention (Days)</Label>
                <Input
                  type="number"
                  value={settings.data_retention_days}
                  onChange={(e) => handleChange('data_retention_days', Number(e.target.value))}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Bell className="w-5 h-5 text-orange-600" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-gray-200">Enable Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Master switch for all notifications</p>
                </div>
                <Switch
                  checked={settings.enable_notifications}
                  onCheckedChange={(checked) => handleChange('enable_notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-gray-200">Email Alerts</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send alerts via email</p>
                </div>
                <Switch
                  checked={settings.enable_email_alerts}
                  onCheckedChange={(checked) => handleChange('enable_email_alerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-gray-200">SMS Alerts</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send alerts via SMS</p>
                </div>
                <Switch
                  checked={settings.enable_sms_alerts}
                  onCheckedChange={(checked) => handleChange('enable_sms_alerts', checked)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-200">Alert Cooldown (Minutes)</Label>
              <Input
                type="number"
                value={settings.alert_cooldown_minutes}
                onChange={(e) => handleChange('alert_cooldown_minutes', Number(e.target.value))}
                className="w-32 dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Minimum time between duplicate alerts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Shield className="w-5 h-5 text-red-600" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Session Timeout (Hours)</Label>
                <Input
                  type="number"
                  value={settings.session_timeout_hours}
                  onChange={(e) => handleChange('session_timeout_hours', Number(e.target.value))}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Password Min Length</Label>
                <Input
                  type="number"
                  value={settings.password_min_length}
                  onChange={(e) => handleChange('password_min_length', Number(e.target.value))}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">API Rate Limit</Label>
                <Input
                  type="number"
                  value={settings.api_rate_limit}
                  onChange={(e) => handleChange('api_rate_limit', Number(e.target.value))}
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-gray-200">Require 2FA</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Force two-factor authentication</p>
                </div>
                <Switch
                  checked={settings.require_2fa}
                  onCheckedChange={(checked) => handleChange('require_2fa', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-gray-200">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable maintenance mode</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}