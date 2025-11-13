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
    <Card className="overflow-hidden border-2 border-purple-100 dark:border-purple-700 dark:bg-[#241B3A]">
      <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-gray-700 dark:bg-gray-800 rounded-lg">
            <Bell className="w-5 h-5 text-purple-400 dark:text-purple-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Notification Preferences
            </h3>
            <p className="text-sm text-gray-300 dark:text-gray-400 font-normal">
              Configure how you want to receive alerts
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Contact Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
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

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4" />

        {/* Alert Channels Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alert Channels
          </h4>
          
          <div className="space-y-3">
            {/* Email Alert Toggle */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                emailAlert
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
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
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                smsAlert
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
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
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                whatsappAlert
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
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
          className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 Enable multiple channels to ensure you never miss important bin alerts
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}