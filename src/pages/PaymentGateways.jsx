import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  AlertTriangle 
} from "lucide-react";

const PaymentGatewayCard = ({ gateway, onEdit, onDelete, onToggleStatus }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  
  const maskedApiKey = gateway.api_key 
    ? `${gateway.api_key.substring(0, 8)}${'*'.repeat(20)}${gateway.api_key.slice(-4)}`
    : 'Not configured';

  return (
    <Card className="dark:bg-[#241B3A] dark:border-purple-700 hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <CreditCard className="w-5 h-5 text-purple-600" />
              {gateway.name}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{gateway.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              className={gateway.is_active 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              }
            >
              {gateway.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {gateway.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-500 dark:text-gray-400">Provider</Label>
            <p className="font-medium dark:text-white">{gateway.provider}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500 dark:text-gray-400">Environment</Label>
            <p className="font-medium dark:text-white capitalize">{gateway.environment}</p>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-gray-500 dark:text-gray-400">API Key</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowApiKey(!showApiKey)}
              className="h-6 px-2"
            >
              {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>
          <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block font-mono">
            {showApiKey ? gateway.api_key || 'Not configured' : maskedApiKey}
          </code>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Switch
              checked={gateway.is_active}
              onCheckedChange={() => onToggleStatus(gateway.id, !gateway.is_active)}
              className="data-[state=checked]:bg-green-600"
            />
            <Label className="text-sm dark:text-gray-300">Enable Gateway</Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(gateway)} className="dark:border-purple-600">
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(gateway.id)} className="text-red-600 border-red-300 hover:bg-red-50">
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PaymentGatewayForm = ({ gateway, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: gateway?.name || '',
    provider: gateway?.provider || 'stripe',
    description: gateway?.description || '',
    api_key: gateway?.api_key || '',
    api_secret: gateway?.api_secret || '',
    webhook_secret: gateway?.webhook_secret || '',
    environment: gateway?.environment || 'sandbox',
    is_active: gateway?.is_active || false,
    supported_currencies: gateway?.supported_currencies || ['USD'],
    webhook_url: gateway?.webhook_url || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="dark:bg-[#241B3A] dark:border-purple-700">
        <CardHeader>
          <CardTitle className="dark:text-white">
            {gateway ? 'Edit Payment Gateway' : 'Add New Payment Gateway'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Gateway Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Primary Stripe"
                  required
                  className="dark:bg-[#1F1235] dark:border-purple-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Provider</Label>
                <select
                  value={formData.provider}
                  onChange={(e) => handleChange('provider', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-purple-600 rounded-md dark:bg-[#1F1235] dark:text-white"
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-200">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of this gateway"
                className="dark:bg-[#1F1235] dark:border-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-200 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API Key
                </Label>
                <Input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => handleChange('api_key', e.target.value)}
                  placeholder="Your API Key"
                  className="dark:bg-[#1F1235] dark:border-purple-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  API Secret
                </Label>
                <Input
                  type="password"
                  value={formData.api_secret}
                  onChange={(e) => handleChange('api_secret', e.target.value)}
                  placeholder="Your API Secret"
                  className="dark:bg-[#1F1235] dark:border-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Webhook Secret</Label>
                <Input
                  type="password"
                  value={formData.webhook_secret}
                  onChange={(e) => handleChange('webhook_secret', e.target.value)}
                  placeholder="Webhook signing secret"
                  className="dark:bg-[#1F1235] dark:border-purple-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Environment</Label>
                <select
                  value={formData.environment}
                  onChange={(e) => handleChange('environment', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-purple-600 rounded-md dark:bg-[#1F1235] dark:text-white"
                >
                  <option value="sandbox">Sandbox/Test</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-200">Webhook URL</Label>
              <Input
                value={formData.webhook_url}
                onChange={(e) => handleChange('webhook_url', e.target.value)}
                placeholder="https://your-app.com/api/webhooks/payment"
                className="dark:bg-[#1F1235] dark:border-purple-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure this URL in your payment provider's webhook settings
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
                className="data-[state=checked]:bg-green-600"
              />
              <Label className="dark:text-gray-200">Enable this gateway</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="dark:border-purple-600">
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                {gateway ? 'Update Gateway' : 'Add Gateway'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function PaymentGateways() {
  const [gateways, setGateways] = useState([
    {
      id: '1',
      name: 'Primary Stripe',
      provider: 'stripe',
      description: 'Main payment processor for subscriptions',
      api_key: 'pk_test_51234567890abcdef...',
      api_secret: 'sk_test_51234567890abcdef...',
      webhook_secret: 'whsec_1234567890abcdef...',
      environment: 'sandbox',
      is_active: true,
      supported_currencies: ['USD', 'EUR'],
      webhook_url: 'https://your-app.com/api/webhooks/stripe'
    }
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);

  const handleSave = (gatewayData) => {
    if (editingGateway) {
      setGateways(prev => prev.map(g => g.id === editingGateway.id ? { ...gatewayData, id: g.id } : g));
    } else {
      setGateways(prev => [...prev, { ...gatewayData, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingGateway(null);
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setShowForm(true);
  };

  const handleDelete = (gatewayId) => {
    if (window.confirm('Are you sure you want to delete this payment gateway?')) {
      setGateways(prev => prev.filter(g => g.id !== gatewayId));
    }
  };

  const handleToggleStatus = (gatewayId, isActive) => {
    setGateways(prev => prev.map(g => g.id === gatewayId ? { ...g, is_active: isActive } : g));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Gateways</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage payment processing and gateway integrations</p>
        </div>
        <Button
          onClick={() => {
            setEditingGateway(null);
            setShowForm(true);
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Gateway
        </Button>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card className="border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-800 dark:text-orange-200">Security Notice</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Never share your API keys or secrets. Always use environment variables in production and rotate keys regularly.
                  Webhook endpoints should be secured with proper authentication.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <PaymentGatewayForm
            gateway={editingGateway}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingGateway(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gateways.map((gateway, index) => (
          <motion.div
            key={gateway.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PaymentGatewayCard
              gateway={gateway}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </motion.div>
        ))}
      </div>

      {gateways.length === 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Payment Gateways</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by adding your first payment gateway</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Gateway
          </Button>
        </motion.div>
      )}
    </div>
  );
}