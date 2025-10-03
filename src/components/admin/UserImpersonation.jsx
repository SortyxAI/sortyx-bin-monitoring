import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  UserCog, 
  Search, 
  Eye, 
  X,
  AlertCircle,
  Shield,
  Users as UsersIcon,
  Activity
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UserImpersonation() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [impersonatedUser, setImpersonatedUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const current = await User.me();
      setCurrentUser(current);
      
      // Check if already impersonating
      const stored = localStorage.getItem('impersonatedUser');
      if (stored) {
        setImpersonatedUser(JSON.parse(stored));
      }
      
      if (current.role === 'admin') {
        const allUsers = await User.list();
        // Filter out current admin from the list
        setUsers(allUsers.filter(u => u.id !== current.id));
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = (user) => {
    localStorage.setItem('impersonatedUser', JSON.stringify(user));
    setImpersonatedUser(user);
    // Reload the page to apply impersonation across all components
    window.location.reload();
  };

  const handleStopImpersonation = () => {
    localStorage.removeItem('impersonatedUser');
    setImpersonatedUser(null);
    // Reload the page to clear impersonation
    window.location.reload();
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'admin') {
    return (
      <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>Access Denied:</strong> Only administrators can access this feature.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Impersonation Banner */}
      <AnimatePresence>
        {impersonatedUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert className="border-orange-300 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
              <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-orange-800 dark:text-orange-200">
                      Currently Impersonating:
                    </span>
                    <Avatar className="w-7 h-7 border-2 border-orange-400">
                      <AvatarImage src={impersonatedUser.profile_photo} />
                      <AvatarFallback className="text-xs bg-orange-200 dark:bg-orange-700">
                        {impersonatedUser.full_name?.[0] || impersonatedUser.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-orange-900 dark:text-orange-100">
                      {impersonatedUser.full_name || impersonatedUser.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopImpersonation}
                    className="border-orange-400 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-800/30"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Stop Impersonation
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="dark:bg-[#241B3A] dark:border-purple-700 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-b dark:border-purple-700">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg"
            >
              <UserCog className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <CardTitle className="dark:text-white text-xl">User Impersonation</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                View and troubleshoot user dashboards as an administrator
              </p>
            </div>
            <Badge variant="outline" className="bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-200 flex items-center gap-1">
              <UsersIcon className="w-3 h-3" />
              {users.length} Users
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 text-base dark:bg-[#1F1235] dark:border-purple-600 dark:text-white"
              />
            </div>
          </div>

          {/* User List */}
          {loading ? (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-600 dark:text-gray-300">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {searchTerm ? 'Try a different search term' : 'No users available to impersonate'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <Card className="overflow-hidden border-2 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-md dark:bg-[#1F1235]/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="w-12 h-12 ring-2 ring-purple-200 dark:ring-purple-700">
                              <AvatarImage src={user.profile_photo} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-400 text-white font-bold">
                                {user.full_name?.[0] || user.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {user.full_name || 'No Name'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1.5">
                              <Badge className={
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-800/70 dark:text-purple-200'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                              }>
                                {user.role}
                              </Badge>
                              <Badge className={
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-800/70 dark:text-green-200'
                                  : 'bg-red-100 text-red-700 dark:bg-red-800/70 dark:text-red-200'
                              }>
                                <Activity className="w-3 h-3 mr-1" />
                                {user.status}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                              {user.subscription_plan || 'free'}
                            </Badge>
                            <Button
                              onClick={() => handleImpersonate(user)}
                              variant={impersonatedUser?.id === user.id ? "default" : "outline"}
                              size="sm"
                              className={
                                impersonatedUser?.id === user.id
                                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                                  : "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-800/30"
                              }
                              disabled={impersonatedUser?.id === user.id}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {impersonatedUser?.id === user.id ? 'Active' : 'View As'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700"
          >
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-bold text-base mb-3">How Impersonation Works:</p>
                <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>Select a user and click <strong>"View As"</strong> to see their dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>All data will be filtered to show only that user's bins and configurations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>You can edit and manage their configurations to help troubleshoot issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>An orange banner will appear at the top showing who you're impersonating</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>Click <strong>"Stop Impersonation"</strong> to return to your admin view</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>Impersonation persists across page refreshes until manually stopped</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}