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
    <Card className="dark:bg-[#241B3A] dark:border-purple-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Subscription Plan
        </CardTitle>
        <Link to={createPageUrl("Pricing")}>
          <Button variant="outline" size="sm" className="dark:border-purple-600 dark:text-purple-300">
            {isFree ? 'Upgrade Plan' : 'Manage Plan'}
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-100 dark:border-purple-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
            <p className="text-lg font-bold capitalize dark:text-white">{currentPlan}</p>
          </div>
          <Badge className={`${planColors[currentPlan]} flex items-center gap-1`}>
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