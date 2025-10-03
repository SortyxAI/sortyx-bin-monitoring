
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

export default function SubscriptionPlanForm({ plan, onSave, onCancel }) {
  const [formData, setFormData] = useState(plan || {
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    description: '',
    features: {
      max_smartbins: 1,
      max_users: 1,
      reporting_access: false,
      api_access: false,
      custom_alerts: false,
      role_management: false,
      priority_support: false,
    },
    is_active: true,
    stripe_price_id_monthly: '',
    stripe_price_id_yearly: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (feature, value) => {
    setFormData(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="dark:bg-[#241B3A] dark:border-purple-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="dark:text-purple-100">
            {plan ? 'Edit Plan' : 'Add New Plan'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-purple-100">Plan Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required className="dark:bg-[#1F1235] dark:border-purple-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_monthly" className="dark:text-purple-100">Monthly Price</Label>
                <Input id="price_monthly" type="number" value={formData.price_monthly} onChange={(e) => handleChange('price_monthly', Number(e.target.value))} required className="dark:bg-[#1F1235] dark:border-purple-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly" className="dark:text-purple-100">Yearly Price</Label>
                <Input id="price_yearly" type="number" value={formData.price_yearly} onChange={(e) => handleChange('price_yearly', Number(e.target.value))} className="dark:bg-[#1F1235] dark:border-purple-500" />
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description" className="dark:text-purple-100">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="dark:bg-[#1F1235] dark:border-purple-500" />
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium dark:text-purple-100">Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_smartbins" className="dark:text-purple-100">Max SmartBins</Label>
                  <Input id="max_smartbins" type="number" value={formData.features.max_smartbins} onChange={(e) => handleFeatureChange('max_smartbins', Number(e.target.value))} className="dark:bg-[#1F1235] dark:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_users" className="dark:text-purple-100">Max Users</Label>
                  <Input id="max_users" type="number" value={formData.features.max_users} onChange={(e) => handleFeatureChange('max_users', Number(e.target.value))} className="dark:bg-[#1F1235] dark:border-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="reporting_access" 
                    checked={formData.features.reporting_access} 
                    onCheckedChange={(c) => handleFeatureChange('reporting_access', c)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                  />
                  <Label htmlFor="reporting_access" className="dark:text-purple-100">Reports</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="api_access" 
                    checked={formData.features.api_access} 
                    onCheckedChange={(c) => handleFeatureChange('api_access', c)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                  />
                  <Label htmlFor="api_access" className="dark:text-purple-100">API Access</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="custom_alerts" 
                    checked={formData.features.custom_alerts} 
                    onCheckedChange={(c) => handleFeatureChange('custom_alerts', c)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                  />
                  <Label htmlFor="custom_alerts" className="dark:text-purple-100">Custom Alerts</Label>
                </div>
                 <div className="flex items-center space-x-2">
                  <Switch 
                    id="role_management" 
                    checked={formData.features.role_management} 
                    onCheckedChange={(c) => handleFeatureChange('role_management', c)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                  />
                  <Label htmlFor="role_management" className="dark:text-purple-100">Role Management</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="priority_support" 
                    checked={formData.features.priority_support} 
                    onCheckedChange={(c) => handleFeatureChange('priority_support', c)}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
                  />
                  <Label htmlFor="priority_support" className="dark:text-purple-100">Priority Support</Label>
                </div>
              </div>
            </div>

             <div className="space-y-4">
              <h4 className="font-medium dark:text-purple-100">Payment Gateway (Stripe)</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe_price_id_monthly" className="dark:text-purple-100">Stripe Monthly Price ID</Label>
                  <Input id="stripe_price_id_monthly" value={formData.stripe_price_id_monthly} onChange={(e) => handleChange('stripe_price_id_monthly', e.target.value)} placeholder="price_..." className="dark:bg-[#1F1235] dark:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe_price_id_yearly" className="dark:text-purple-100">Stripe Yearly Price ID</Label>
                  <Input id="stripe_price_id_yearly" value={formData.stripe_price_id_yearly} onChange={(e) => handleChange('stripe_price_id_yearly', e.target.value)} placeholder="price_..." className="dark:bg-[#1F1235] dark:border-purple-500" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="is_active" 
                checked={formData.is_active} 
                onCheckedChange={(c) => handleChange('is_active', c)}
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
              />
              <Label htmlFor="is_active" className="dark:text-purple-100">Plan is Active</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="dark:border-purple-500 dark:text-purple-200">Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">{plan ? 'Update Plan' : 'Create Plan'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
