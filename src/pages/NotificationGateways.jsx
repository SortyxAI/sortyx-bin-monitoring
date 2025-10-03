import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Save, TestTube, CheckCircle, AlertCircle } from "lucide-react";

export default function NotificationGateways() {
  const [emailConfig, setEmailConfig] = useState({
    enabled: false,
    provider: "smtp",
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    from_email: "",
    from_name: "Sortyx SmartBin",
    use_tls: true
  });

  const [smsConfig, setSmsConfig] = useState({
    enabled: false,
    provider: "twilio",
    api_key: "",
    api_secret: "",
    from_number: "",
    webhook_url: ""
  });

  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});

  const handleEmailConfigChange = (field, value) => {
    setEmailConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSmsConfigChange = (field, value) => {
    setSmsConfig(prev => ({ ...prev, [field]: value }));
  };

  const testEmailConfig = async () => {
    setLoading(prev => ({ ...prev, email: true }));
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults(prev => ({ ...prev, email: { success: true, message: "Email test sent successfully!" } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, email: { success: false, message: "Email test failed. Please check your configuration." } }));
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const testSmsConfig = async () => {
    setLoading(prev => ({ ...prev, sms: true }));
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults(prev => ({ ...prev, sms: { success: true, message: "SMS test sent successfully!" } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, sms: { success: false, message: "SMS test failed. Please check your configuration." } }));
    } finally {
      setLoading(prev => ({ ...prev, sms: false }));
    }
  };

  const saveConfiguration = async () => {
    setLoading(prev => ({ ...prev, save: true }));
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Saving configurations:", { emailConfig, smsConfig });
      alert("Configuration saved successfully!");
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Error saving configuration. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification Gateways</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Configure email and SMS services for system alerts</p>
      </motion.div>

      <div className="space-y-8">
        {/* Email Configuration */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Service Configuration
              </CardTitle>
              <div className="flex items-center gap-3">
                {testResults.email && (
                  <Badge className={testResults.email.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {testResults.email.success ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                    {testResults.email.success ? 'Test Passed' : 'Test Failed'}
                  </Badge>
                )}
                <Switch
                  checked={emailConfig.enabled}
                  onCheckedChange={(checked) => handleEmailConfigChange('enabled', checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">Email Provider</Label>
                  <Select 
                    value={emailConfig.provider} 
                    onValueChange={(value) => handleEmailConfigChange('provider', value)}
                  >
                    <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                      <SelectItem value="smtp" className="dark:text-gray-200">SMTP</SelectItem>
                      <SelectItem value="sendgrid" className="dark:text-gray-200">SendGrid</SelectItem>
                      <SelectItem value="mailgun" className="dark:text-gray-200">Mailgun</SelectItem>
                      <SelectItem value="aws_ses" className="dark:text-gray-200">AWS SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">From Email</Label>
                  <Input
                    type="email"
                    value={emailConfig.from_email}
                    onChange={(e) => handleEmailConfigChange('from_email', e.target.value)}
                    placeholder="noreply@yourcompany.com"
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">From Name</Label>
                  <Input
                    value={emailConfig.from_name}
                    onChange={(e) => handleEmailConfigChange('from_name', e.target.value)}
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">SMTP Host</Label>
                  <Input
                    value={emailConfig.smtp_host}
                    onChange={(e) => handleEmailConfigChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">SMTP Port</Label>
                  <Input
                    type="number"
                    value={emailConfig.smtp_port}
                    onChange={(e) => handleEmailConfigChange('smtp_port', Number(e.target.value))}
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">Username</Label>
                  <Input
                    value={emailConfig.smtp_username}
                    onChange={(e) => handleEmailConfigChange('smtp_username', e.target.value)}
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">Password</Label>
                  <Input
                    type="password"
                    value={emailConfig.smtp_password}
                    onChange={(e) => handleEmailConfigChange('smtp_password', e.target.value)}
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="dark:text-gray-200">Use TLS/SSL</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable encrypted connection</p>
                </div>
                <Switch
                  checked={emailConfig.use_tls}
                  onCheckedChange={(checked) => handleEmailConfigChange('use_tls', checked)}
                />
              </div>

              {testResults.email && (
                <div className={`p-3 rounded-lg ${testResults.email.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <p className={`text-sm ${testResults.email.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {testResults.email.message}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={testEmailConfig}
                  disabled={!emailConfig.enabled || loading.email}
                  variant="outline"
                  className="dark:border-purple-600 dark:text-purple-300"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {loading.email ? "Testing..." : "Test Email"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Configuration */}
        <Card className="dark:bg-[#241B3A] dark:border-purple-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <MessageSquare className="w-5 h-5 text-green-600" />
                SMS Service Configuration
              </CardTitle>
              <div className="flex items-center gap-3">
                {testResults.sms && (
                  <Badge className={testResults.sms.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {testResults.sms.success ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                    {testResults.sms.success ? 'Test Passed' : 'Test Failed'}
                  </Badge>
                )}
                <Switch
                  checked={smsConfig.enabled}
                  onCheckedChange={(checked) => handleSmsConfigChange('enabled', checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">SMS Provider</Label>
                  <Select 
                    value={smsConfig.provider} 
                    onValueChange={(value) => handleSmsConfigChange('provider', value)}
                  >
                    <SelectTrigger className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#241B3A] dark:border-purple-700">
                      <SelectItem value="twilio" className="dark:text-gray-200">Twilio</SelectItem>
                      <SelectItem value="aws_sns" className="dark:text-gray-200">AWS SNS</SelectItem>
                      <SelectItem value="nexmo" className="dark:text-gray-200">Vonage (Nexmo)</SelectItem>
                      <SelectItem value="textlocal" className="dark:text-gray-200">TextLocal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">From Number</Label>
                  <Input
                    value={smsConfig.from_number}
                    onChange={(e) => handleSmsConfigChange('from_number', e.target.value)}
                    placeholder="+1234567890"
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">API Key</Label>
                  <Input
                    type="password"
                    value={smsConfig.api_key}
                    onChange={(e) => handleSmsConfigChange('api_key', e.target.value)}
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-200">API Secret</Label>
                  <Input
                    type="password"
                    value={smsConfig.api_secret}
                    onChange={(e) => handleSmsConfigChange('api_secret', e.target.value)}
                    className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Webhook URL (Optional)</Label>
                <Input
                  value={smsConfig.webhook_url}
                  onChange={(e) => handleSmsConfigChange('webhook_url', e.target.value)}
                  placeholder="https://your-app.com/sms/webhook"
                  className="dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  URL to receive delivery status updates
                </p>
              </div>

              {testResults.sms && (
                <div className={`p-3 rounded-lg ${testResults.sms.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <p className={`text-sm ${testResults.sms.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {testResults.sms.message}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={testSmsConfig}
                  disabled={!smsConfig.enabled || loading.sms}
                  variant="outline"
                  className="dark:border-purple-600 dark:text-purple-300"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {loading.sms ? "Testing..." : "Test SMS"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Configuration */}
        <div className="flex justify-end">
          <Button 
            onClick={saveConfiguration}
            disabled={loading.save}
            className="bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading.save ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}