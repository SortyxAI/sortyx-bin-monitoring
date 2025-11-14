import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, Zap } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SubscriptionInfo({ user }) {
  const planColors = {
    free: "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200",
    basic: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    premium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200",
    enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200",
  };
  
  const currentPlan = user.subscription_plan || 'free';
  const isFree = currentPlan === 'free';
  
  return (
    <Card className="overflow-hidden shadow-xl border-2 border-purple-200 dark:border-purple-700 dark:bg-[#241B3A]">
      <CardHeader className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white border-b-4 border-purple-300 dark:border-purple-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg shadow-lg border border-white/30">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            Subscription Plan
          </CardTitle>
          <Link to={createPageUrl("Pricing")}>
            <Button variant="outline" size="sm" className="bg-white text-purple-700 hover:bg-purple-50 border-2 border-white/50 font-semibold shadow-lg">
              {isFree ? 'Upgrade Plan' : 'Manage Plan'}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/10 dark:via-[#1a1325] dark:to-blue-950/10">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-lg border-2 border-yellow-600 shadow-lg">
          <div>
            <p className="text-sm text-gray-700 font-medium">Current Plan</p>
            <p className="text-2xl font-bold capitalize text-gray-900">{currentPlan}</p>
          </div>
          <Badge className={`${planColors[currentPlan]} flex items-center gap-1 px-3 py-1 text-sm font-semibold shadow-md`}>
            {isFree && <Zap className="w-3 h-3" />}
            {isFree ? 'Free Forever' : 'Active'}
          </Badge>
        </div>
        {user.subscription_expiry && !isFree && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <span>Renews on {format(new Date(user.subscription_expiry), 'MMMM dd, yyyy')}</span>
          </div>
        )}
        {isFree && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Free Plan includes:</strong> Up to 5 SmartBins, 1 user, basic monitoring features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}