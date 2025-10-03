import React from "react";
import { motion } from "framer-motion";
import UserImpersonation from "../components/admin/UserImpersonation";

export default function Impersonate() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Impersonation</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          View and manage user dashboards for troubleshooting and support
        </p>
      </motion.div>

      <UserImpersonation />
    </div>
  );
}