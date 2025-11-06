import React, { useState } from "react";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Mail, UserPlus, LogIn, Lock } from "lucide-react";

import { User } from "@/api/customClient";
import Logo from "../assets/Logo.jpeg";
import DarkModeLogo from "../assets/Logo-darkmode.jpeg";

export default function Register({ onLogin, onNavigateToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await User.register(email, password);
      console.log("Registration Successful: ", response);

      onLogin(response.user);
    } catch (error) {
      console.log("Registration failed :", error);

      let errorMessage = "Registration failed. Please try again.";
      if (error.message.includes("auth/email-already-in-use")) {
        errorMessage = "This email address is already registered.";
      } else if (error.message.includes("auth/weak-password")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message.includes("auth/invalid-email")) {
        errorMessage = "The email address is not valid.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 dark:from-[#0F0818] dark:via-[#1a0a2e] dark:to-[#16213e] p-4">
      {/* Animated background (Reuse from Login.jsx) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Motion divs here... */}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 dark:bg-[#2A1F3D]/90 backdrop-blur-sm border-2 border-purple-200/50 dark:border-purple-600/30 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center">
              {isDarkMode ? (
                <img
                  src={DarkModeLogo}
                  alt="Logo"
                  className="w-16 h-15 rounded-full"
                />
              ) : (
                <img src={Logo} alt="Logo" className="w-16 h-15 rounded-full" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 dark:from-purple-300 dark:via-indigo-300 dark:to-purple-500 bg-clip-text text-transparent">
              Create New Account
            </CardTitle>
            <p className="text-gray-600 dark:text-purple-200 mt-2">
              Join the Sortyx community
            </p>
          </CardHeader>

          <CardContent>
            {/* 🔑 Call handleRegister here */}
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert className="border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                    {error}
                  </Alert>
                </motion.div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-700 dark:text-purple-200"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-gray-700 dark:text-purple-200"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 chars)"
                    className="pl-10 border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                className="text-purple-600 dark:text-purple-400"
                onClick={onNavigateToLogin} // New function to switch back to Login
              >
                Already have an account? Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
