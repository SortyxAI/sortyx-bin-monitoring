
import React, { useState, useEffect } from "react";
import { SubscriptionPlan } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import SubscriptionPlanForm from "../components/admin/SubscriptionPlanForm";

const FeatureItem = ({ label, enabled }) => (
  <div className="flex items-center gap-2">
    {enabled ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )}
    <span className="text-sm dark:text-gray-300">{label}</span>
  </div>
);

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const defaultFreePlan = {
    id: "default-free-plan", // A unique, non-database ID for the placeholder
    name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    description: "Perfect for getting started",
    features: {
      max_smartbins: 5,
      max_users: 1,
      reporting_access: false,
      api_access: false,
      custom_alerts: false,
      role_management: false,
      priority_support: false
    },
    is_active: true,
    stripe_price_id_monthly: "",
    stripe_price_id_yearly: ""
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const fetchedPlans = await SubscriptionPlan.list();
      setPlans(fetchedPlans);
    } catch (error) {
      console.error("Error loading subscription plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (planData) => {
    try {
      // If editingPlan has an ID and it's not the default placeholder, it's an update.
      if (editingPlan && editingPlan.id && editingPlan.id !== "default-free-plan") {
        await SubscriptionPlan.update(editingPlan.id, planData);
      } else {
        // Otherwise, it's a creation (either a brand new plan or creating a plan based on defaultFreePlan).
        await SubscriptionPlan.create(planData);
      }
      setShowForm(false);
      setEditingPlan(null);
      loadPlans();
    } catch (error) {
      console.error("Error saving subscription plan:", error);
    }
  };

  const handleDelete = async (planId) => {
    // Prevent deletion of the default Free plan placeholder
    if (planId === "default-free-plan") {
      console.warn("Cannot delete the default Free plan placeholder.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await SubscriptionPlan.delete(planId);
        loadPlans();
      } catch (error) {
        console.error("Error deleting subscription plan:", error);
      }
    }
  };

  const handleEdit = (plan) => {
    // The defaultFreePlan should not be directly editable via this handler as it's a placeholder.
    // If the edit button was somehow rendered for it (which it shouldn't be with current logic),
    // we prevent action or redirect to 'add new'.
    if (plan.id === "default-free-plan") {
      console.warn("The default Free plan placeholder cannot be edited directly. Create a new plan to manage a Free tier.");
      handleAddNew(defaultFreePlan); // Suggest creating a new plan pre-filled with free details
      return;
    }
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleAddNew = (initialPlanData = null) => {
    setEditingPlan(initialPlanData); // If initialPlanData is provided (e.g., from defaultFreePlan), set it to pre-fill the form. Otherwise, it's null for an empty form.
    setShowForm(true);
  };

  // Check if there is an actual free plan (price_monthly === 0) loaded from the backend
  const hasActualFreePlan = plans.some(p => p.price_monthly === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage pricing tiers and features for your users.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Plan
        </Button>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <SubscriptionPlanForm
            plan={editingPlan}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {loading ? (
          <p>Loading plans...</p>
        ) : (
          <>
            {!hasActualFreePlan && (
              // Display the default Free plan placeholder if no actual free plan is found
              <motion.div
                key={defaultFreePlan.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0 * 0.1 }}
              >
                <Card className="dark:bg-[#241B3A] dark:border-purple-700 h-full flex flex-col relative border-2 border-dashed border-gray-400">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="dark:text-white">{defaultFreePlan.name}</CardTitle>
                        <p className="text-2xl font-bold dark:text-purple-300">
                          ${defaultFreePlan.price_monthly}
                          <span className="text-sm font-normal text-gray-500">/month</span>
                        </p>
                      </div>
                      {/* Button to create a custom Free plan based on default values */}
                      <Button variant="ghost" size="icon" onClick={() => handleAddNew(defaultFreePlan)} title="Create a custom Free plan">
                          <Plus className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{defaultFreePlan.description}</p>
                    <div className="space-y-2">
                      <FeatureItem label={`Up to ${defaultFreePlan.features.max_smartbins} SmartBins`} enabled={true} />
                      <FeatureItem label={`Up to ${defaultFreePlan.features.max_users} Users`} enabled={true} />
                      <FeatureItem label="Advanced Reports" enabled={defaultFreePlan.features.reporting_access} />
                      <FeatureItem label="API Access" enabled={defaultFreePlan.features.api_access} />
                      <FeatureItem label="Custom Alerts" enabled={defaultFreePlan.features.custom_alerts} />
                      <FeatureItem label="Role Management" enabled={defaultFreePlan.features.role_management} />
                      <FeatureItem label="Priority Support" enabled={defaultFreePlan.features.priority_support} />
                    </div>
                    <p className="text-xs text-gray-500 mt-4 italic">
                      This is a default Free plan. Create a custom 'Free' plan above to manage its settings.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                // Adjust delay if the default free plan is also rendered (i.e., this plan is not the first visually)
                transition={{ delay: (hasActualFreePlan ? index : index + 1) * 0.1 }}
              >
                <Card className="dark:bg-[#241B3A] dark:border-purple-700 h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="dark:text-white">{plan.name}</CardTitle>
                        <p className="text-2xl font-bold dark:text-purple-300">
                          ${plan.price_monthly}
                          <span className="text-sm font-normal text-gray-500">/month</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                              <Edit className="w-4 h-4 text-gray-400" />
                          </Button>
                          {/* Allow deletion for all plans fetched from the backend, including actual free plans */}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                    <div className="space-y-2">
                      <FeatureItem label={`Up to ${plan.features.max_smartbins} SmartBins`} enabled={true} />
                      <FeatureItem label={`Up to ${plan.features.max_users} Users`} enabled={true} />
                      <FeatureItem label="Advanced Reports" enabled={plan.features.reporting_access} />
                      <FeatureItem label="API Access" enabled={plan.features.api_access} />
                      <FeatureItem label="Custom Alerts" enabled={plan.features.custom_alerts} />
                      <FeatureItem label="Role Management" enabled={plan.features.role_management} />
                      <FeatureItem label="Priority Support" enabled={plan.features.priority_support} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
