import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, Mail, MessageSquare, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationPreferences({ user, onUpdate }) {
  const [emailAlert, setEmailAlert] = useState(user.email_alert_enabled ?? false);
  const [smsAlert, setSmsAlert] = useState(user.sms_alert_enabled ?? false);
  const [whatsappAlert, setWhatsappAlert] = useState(user.whatsapp_alert_enabled ?? false);
  const [alertEmail, setAlertEmail] = useState(user.alert_email || user.email || "");
  const [alertPhone, setAlertPhone] = useState(user.alert_phone || "");

  const handleEmailToggle = (enabled) => {
    setEmailAlert(enabled);
    onUpdate({ email_alert_enabled: enabled });
  };

  const handleSmsToggle = (enabled) => {
    setSmsAlert(enabled);
    onUpdate({ sms_alert_enabled: enabled });
  };

  const handleWhatsappToggle = (enabled) => {
    setWhatsappAlert(enabled);
    onUpdate({ whatsapp_alert_enabled: enabled });
  };

  const handleEmailUpdate = (e) => {
    const value = e.target.value;
    setAlertEmail(value);
  };

  const handlePhoneUpdate = (e) => {
    const value = e.target.value;
    setAlertPhone(value);
  };

  const handleEmailBlur = () => {
    if (alertEmail !== (user.alert_email || user.email || "")) {
      onUpdate({ alert_email: alertEmail });
    }
  };

  const handlePhoneBlur = () => {
    if (alertPhone !== (user.alert_phone || "")) {
      onUpdate({ alert_phone: alertPhone });
    }
  };

  return (
    <Card className="overflow-hidden shadow-xl border-2 border-purple-200 dark:border-purple-700 dark:bg-[#241B3A]">
      <CardHeader className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white border-b-4 border-blue-300 dark:border-blue-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <CardTitle className="relative flex items-center gap-2">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg shadow-lg border border-white/30">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Notification Preferences
            </h3>
            <p className="text-sm text-white/80 font-normal">
              Configure how you want to receive alerts
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/10 dark:via-[#1a1325] dark:to-purple-950/10">
        {/* Contact Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 p-4 bg-gradient-to-r from-purple-50/50 via-blue-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-purple-200 dark:border-purple-700"
        >
          <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Contact Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alert-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Alert Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="alert-email"
                  type="email"
                  placeholder="your@email.com"
                  value={alertEmail}
                  onChange={handleEmailUpdate}
                  onBlur={handleEmailBlur}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Alert Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="alert-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={alertPhone}
                  onChange={handlePhoneUpdate}
                  onBlur={handlePhoneBlur}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="border-t-2 border-gradient-to-r from-purple-200 via-blue-200 to-indigo-200 dark:from-purple-700 dark:via-blue-700 dark:to-indigo-700 pt-4" />

        {/* Alert Channels Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 p-4 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-700"
        >
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alert Channels
          </h4>
          
          <div className="space-y-3">
            {/* Email Alert Toggle */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 shadow-md ${
                emailAlert
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-gradient-to-r dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-700"
                  : "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    emailAlert
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <Mail
                    className={`w-5 h-5 transition-colors duration-200 ${
                      emailAlert
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="email-alert" className="font-medium text-gray-900 dark:text-white cursor-pointer">
                    Email Alerts
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-alert"
                checked={emailAlert}
                onCheckedChange={handleEmailToggle}
                className={`${
                  emailAlert
                    ? "bg-green-500 data-[state=checked]:bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            </motion.div>

            {/* SMS Alert Toggle */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 shadow-md ${
                smsAlert
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-gradient-to-r dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    smsAlert
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <MessageSquare
                    className={`w-5 h-5 transition-colors duration-200 ${
                      smsAlert
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="sms-alert" className="font-medium text-gray-900 dark:text-white cursor-pointer">
                    SMS Alerts
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get text messages for urgent alerts
                  </p>
                </div>
              </div>
              <Switch
                id="sms-alert"
                checked={smsAlert}
                onCheckedChange={handleSmsToggle}
                className={`${
                  smsAlert
                    ? "bg-green-500 data-[state=checked]:bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            </motion.div>

            {/* WhatsApp Alert Toggle */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 shadow-md ${
                whatsappAlert
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-gradient-to-r dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-700"
                  : "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    whatsappAlert
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <MessageSquare
                    className={`w-5 h-5 transition-colors duration-200 ${
                      whatsappAlert
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="whatsapp-alert" className="font-medium text-gray-900 dark:text-white cursor-pointer">
                    WhatsApp Alerts
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications on WhatsApp
                  </p>
                </div>
              </div>
              <Switch
                id="whatsapp-alert"
                checked={whatsappAlert}
                onCheckedChange={handleWhatsappToggle}
                className={`${
                  whatsappAlert
                    ? "bg-green-500 data-[state=checked]:bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 dark:from-yellow-950/30 dark:via-yellow-900/30 dark:to-yellow-950/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg shadow-md"
        >
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            💡 Enable multiple channels to ensure you never miss important bin alerts
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}