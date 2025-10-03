import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Crown } from "lucide-react";
import UserTable from "../components/admin/UserTable";
import UserEditDialog from "../components/admin/UserEditDialog";
import AddUserDialog from "../components/admin/AddUserDialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await User.list();
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
      setMessage({
        type: "error",
        text: "Failed to load users. You may not have permission to access this data."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      await User.update(userId, data);
      setEditingUser(null);
      setMessage({
        type: "success",
        text: "User updated successfully!"
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      
      let errorMessage = "Failed to update user.";
      if (error.message.includes("Only paid users can update user roles")) {
        errorMessage = "Role updates require a premium subscription. Other changes were saved successfully.";
        setMessage({ type: "warning", text: errorMessage });
      } else if (error.message.includes("403") || error.message.includes("permission")) {
        errorMessage = "You don't have permission to update this user. Please contact your administrator.";
        setMessage({ type: "error", text: errorMessage });
      } else {
        errorMessage = error.message || "Please check your permissions and try again.";
        setMessage({ type: "error", text: errorMessage });
      }
      
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await User.delete(userId);
        setMessage({
          type: "success",
          text: "User deleted successfully!"
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        loadUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        setMessage({
          type: "error",
          text: error.message.includes("403") ? 
            "You don't have permission to delete users." : 
            "Failed to delete user. Please try again."
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      }
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      console.log("Attempting to create user:", userData);
      
      // Try to create the user
      const newUser = await User.create(userData);
      
      setShowAddUser(false);
      setMessage({
        type: "success",
        text: "User created successfully!"
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      loadUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to create user.";
      let messageType = "error";
      
      if (error.message.includes("Only paid users can update user roles")) {
        errorMessage = "User created successfully with 'User' role. Premium subscription required for admin role assignment.";
        messageType = "warning";
        // Don't close the dialog, but show success with warning
        setShowAddUser(false);
        loadUsers();
      } else if (error.message.includes("permission") || error.message.includes("403")) {
        errorMessage = "You don't have permission to create users. This feature may require special admin privileges.";
      } else if (error.message.includes("email") && error.message.includes("exists")) {
        errorMessage = "A user with this email address already exists.";
      } else if (error.message.includes("validation")) {
        errorMessage = "Please check all required fields and try again.";
      } else if (error.message.includes("User creation")) {
        errorMessage = "User creation is restricted in base44. Users typically need to be invited through the platform's invite system.";
      } else {
        errorMessage = `${errorMessage} Error: ${error.message}`;
      }
      
      setMessage({
        type: messageType,
        text: errorMessage
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 7000);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPremiumUser = currentUser?.subscription_plan === 'premium' || currentUser?.subscription_plan === 'enterprise';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">View, edit, and manage all user accounts.</p>
      </motion.div>

      {/* Subscription Info */}
      {!isPremiumUser && (
        <Alert className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <Crown className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <span className="font-semibold">Basic Plan:</span> Some user management features require a premium subscription. 
            <Button variant="link" className="p-0 h-auto text-blue-700 dark:text-blue-300 underline ml-1">
              Upgrade to unlock all features
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Messages */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert className={
            message.type === "error" ? "border-red-200 dark:border-red-800" : 
            message.type === "warning" ? "border-yellow-200 dark:border-yellow-800" :
            "border-green-200 dark:border-green-800"
          }>
            {message.type === "error" ? <AlertCircle className="h-4 w-4 text-red-600" /> : 
             message.type === "warning" ? <Info className="h-4 w-4 text-yellow-600" /> :
             <CheckCircle className="h-4 w-4 text-green-600" />}
            <AlertDescription className={
              message.type === "error" ? "text-red-800 dark:text-red-200" : 
              message.type === "warning" ? "text-yellow-800 dark:text-yellow-200" :
              "text-green-800 dark:text-green-200"
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Card className="dark:bg-[#241B3A] dark:border-purple-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="dark:text-white">All Users ({users.length})</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
                />
              </div>
              <Button 
                onClick={() => setShowAddUser(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserTable
            users={filteredUsers}
            loading={loading}
            onEdit={setEditingUser}
            onDelete={handleDeleteUser}
          />
        </CardContent>
      </Card>
      
      {editingUser && (
        <UserEditDialog
          user={editingUser}
          onOpenChange={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      )}
      
      <AddUserDialog
        open={showAddUser}
        onOpenChange={setShowAddUser}
        onSave={handleCreateUser}
      />
    </div>
  );
}