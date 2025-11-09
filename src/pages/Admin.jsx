import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, CreditCard, Bell, Key, Globe, UserCog, ChevronRight, LayoutDashboard, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserImpersonation from "../components/admin/UserImpersonation";
import DevToolsPanel from "../components/DevTools/DevToolsPanel";

const adminFeatures = [
  {
    title: "User Management",
    description: "Create, edit, and manage user accounts and roles.",
    icon: Users,
    url: createPageUrl("Users"),
    color: "text-purple-600",
  },
  {
    title: "System Settings",
    description: "Configure application-wide parameters and branding.",
    icon: Settings,
    url: createPageUrl("SystemSettings"),
    color: "text-blue-600",
  },
  {
    title: "Subscription Plans",
    description: "Define and manage subscription tiers and features.",
    icon: CreditCard,
    url: createPageUrl("SubscriptionPlans"),
    color: "text-green-600",
  },
  {
    title: "Payment Gateways",
    description: "Configure and manage payment processing gateways.",
    icon: Key,
    url: createPageUrl("PaymentGateways"),
    color: "text-orange-600",
  },
  {
    title: "Notification Gateways",
    description: "Manage integrations for SMS and email services.",
    icon: Bell,
    url: createPageUrl("NotificationGateways"),
    color: "text-red-600",
  },
  {
    title: "API Guide",
    description: "Documentation and guides for API integration.",
    icon: Globe,
    url: createPageUrl("APIGuide"),
    color: "text-indigo-600",
  },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">System-wide management and configuration</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-3 gap-2 h-auto p-2 dark:bg-[#241B3A] bg-gray-100">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white dark:data-[state=active]:from-purple-500 dark:data-[state=active]:to-indigo-500 transition-all duration-300 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-purple-800/30"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Admin Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="impersonate" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white dark:data-[state=active]:from-orange-500 dark:data-[state=active]:to-amber-500 transition-all duration-300 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-orange-800/30"
          >
            <UserCog className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">User Impersonation</span>
            <span className="sm:hidden">Impersonate</span>
          </TabsTrigger>
          <TabsTrigger 
            value="devtools" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-teal-600 data-[state=active]:text-white dark:data-[state=active]:from-green-500 dark:data-[state=active]:to-teal-500 transition-all duration-300 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-green-800/30"
          >
            <Wrench className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">DevTools</span>
            <span className="sm:hidden">Dev</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <motion.div
            key="overview-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={feature.url} className="block h-full group">
                    <Card className="h-full hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 dark:bg-[#241B3A] dark:border-purple-700 group-hover:scale-[1.02]">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 bg-gray-100 dark:bg-purple-800/50 rounded-lg ${feature.color} group-hover:scale-110 transition-transform`}>
                              <feature.icon className="w-6 h-6" />
                            </div>
                            <CardTitle className="dark:text-white">{feature.title}</CardTitle>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="impersonate" className="space-y-6">
          <motion.div
            key="impersonate-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <UserImpersonation />
          </motion.div>
        </TabsContent>

        <TabsContent value="devtools" className="space-y-6">
          <motion.div
            key="devtools-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DevToolsPanel />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
