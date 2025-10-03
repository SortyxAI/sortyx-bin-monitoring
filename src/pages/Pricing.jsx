
import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '@/api/entities';
import { User } from '@/api/entities';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Star, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const FeatureDisplay = ({ label, included }) => (
  <li className="flex items-center space-x-3">
    {included ? (
      <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
    ) : (
      <X className="flex-shrink-0 w-5 h-5 text-gray-400" />
    )}
    <span className="text-gray-700 dark:text-gray-300">{label}</span>
  </li>
);

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [planData, userData] = await Promise.all([
          SubscriptionPlan.filter({ is_active: true }),
          User.me().catch(() => null)
        ]);
        setPlans(planData.sort((a, b) => a.price_monthly - b.price_monthly));
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleSubscribe = async (plan) => {
    if (subscribing || !user) return;
    
    // Don't allow subscribing to Free plan
    if (plan.name.toLowerCase() === 'free') {
      alert("You are already on the Free plan!");
      return;
    }
    
    setSubscribing(plan.id);
    try {
      // Simulate subscription process with payment gateway
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Calculate subscription expiry based on billing cycle
      const currentDate = new Date();
      let expiryDate;
      
      if (billingCycle === 'yearly') {
        expiryDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
      } else {
        expiryDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      }
      
      // Update user's subscription
      await User.updateMyUserData({
        subscription_plan: plan.name.toLowerCase(),
        subscription_expiry: expiryDate.toISOString().split('T')[0]
      });
      
      // Refresh user data
      const updatedUser = await User.me();
      setUser(updatedUser);
      
      alert(`Successfully subscribed to ${plan.name} ${billingCycle} plan!`);
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Subscription failed. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Find the Perfect Plan</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Start for free, then grow with us. Simple, transparent pricing.</p>
      </motion.div>

      {/* Enhanced Billing Toggle */}
      <div className="flex items-center justify-center space-x-4 mb-12">
        <Label 
          htmlFor="billing-cycle" 
          className={`font-medium transition-colors duration-300 ${
            billingCycle === 'monthly' 
              ? 'text-green-600 dark:text-green-400 font-bold' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Monthly
        </Label>
        <div className="relative">
          <Switch
            id="billing-cycle"
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400 scale-125"
          />
        </div>
        <Label 
          htmlFor="billing-cycle" 
          className={`font-medium transition-colors duration-300 ${
            billingCycle === 'yearly' 
              ? 'text-green-600 dark:text-green-400 font-bold' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Yearly <span className="text-green-600 font-bold">(Save 20%)</span>
        </Label>
      </div>

      {loading ? (
         <div className="text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
           <p className="mt-4">Loading plans...</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => {
            // Get user's current plan, default to 'free' if not set
            const userPlan = user?.subscription_plan || 'free';
            const isCurrentPlan = userPlan === plan.name.toLowerCase();
            const isFreePlan = plan.name.toLowerCase() === 'free';
            const price = billingCycle === 'yearly' && plan.price_yearly ? plan.price_yearly : plan.price_monthly;
            const cycleText = billingCycle === 'yearly' ? 'year' : 'month';
            const canSubscribe = user && !isCurrentPlan && !isFreePlan;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full relative"
              >
                <Card className={`h-full flex flex-col dark:bg-[#241B3A] ${
                  isCurrentPlan 
                    ? 'border-2 border-green-500 dark:border-green-400 shadow-2xl ring-4 ring-green-500/20' 
                    : isFreePlan
                    ? 'border-2 border-blue-400 dark:border-blue-500'
                    : 'dark:border-purple-700 hover:border-green-300 dark:hover:border-green-600'
                } transition-all duration-300`}>
                  {isCurrentPlan && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg z-10"
                    >
                      <Star className="w-4 h-4" />
                      Current Plan
                    </motion.div>
                  )}
                  {isFreePlan && !isCurrentPlan && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg z-10"
                    >
                      <Zap className="w-4 h-4" />
                      Default Plan
                    </motion.div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold dark:text-white">{plan.name}</CardTitle>
                    <p className="text-gray-500 dark:text-gray-400">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-center mb-6">
                      <motion.span 
                        className="text-4xl font-extrabold dark:text-purple-200"
                        key={`${price}-${billingCycle}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        ${price}
                      </motion.span>
                      <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                        {isFreePlan ? '/forever' : `/${cycleText}`}
                      </span>
                    </div>
                    <ul className="space-y-3">
                      <FeatureDisplay label={`Up to ${plan.features.max_smartbins} SmartBins`} included={true} />
                      <FeatureDisplay label={`Up to ${plan.features.max_users} Users`} included={true} />
                      <FeatureDisplay label="Advanced Reports" included={plan.features.reporting_access} />
                      <FeatureDisplay label="API Access" included={plan.features.api_access} />
                      <FeatureDisplay label="Custom Alerts" included={plan.features.custom_alerts} />
                      <FeatureDisplay label="Role Management" included={plan.features.role_management} />
                      <FeatureDisplay label="Priority Support" included={plan.features.priority_support} />
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {!user ? (
                      <Button 
                        className="w-full bg-gray-400 cursor-not-allowed"
                        disabled
                      >
                        Login Required
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full transition-all duration-300 ${
                          isCurrentPlan 
                            ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed' 
                            : isFreePlan
                            ? 'bg-blue-500 hover:bg-blue-600 cursor-not-allowed'
                            : subscribing === plan.id
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
                        }`}
                        onClick={() => handleSubscribe(plan)}
                        disabled={isCurrentPlan || isFreePlan || subscribing === plan.id}
                      >
                        {subscribing === plan.id ? (
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            Processing...
                          </div>
                        ) : isCurrentPlan ? (
                          'Active Plan'
                        ) : isFreePlan ? (
                          'Default Plan'
                        ) : (
                          `Subscribe ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
