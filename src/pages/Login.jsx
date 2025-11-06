import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Trash2, LogIn, Mail, Lock, User as UserIcon, ArrowLeft, Chrome, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import Logo from "../assets/Logo.jpeg";
import DarkModeLogo from "../assets/Logo-darkmode.jpeg";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  // Password strength indicator
  const getPasswordStrength = (pass) => {
    if (!pass) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'red', 'orange', 'yellow', 'green'];
    return { strength, label: labels[strength], color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        // Login
        const response = await User.login(email, password);
        console.log('Login successful:', response);
        onLogin(response.user);
      } else if (mode === 'signup') {
        // Validation
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        if (!fullName.trim()) {
          throw new Error('Full name is required');
        }

        // Register
        const response = await User.register(email, password, fullName.trim());
        console.log('Registration successful:', response);
        setSuccess('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLogin(response.user);
        }, 1500);
      } else if (mode === 'forgot-password') {
        // Password reset
        await User.resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
        setTimeout(() => {
          setMode('login');
          setSuccess('');
        }, 3000);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('Google login successful:', user);
      
      // Create/update user profile in Firestore
      const userProfile = await User.me();
      onLogin(userProfile);
    } catch (error) {
      console.error('Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Sign-in was cancelled.');
      } else {
        setError(error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 dark:from-[#0F0818] dark:via-[#1a0a2e] dark:to-[#16213e] p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 dark:bg-[#2A1F3D]/90 backdrop-blur-sm border-2 border-purple-200/50 dark:border-purple-600/30 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              {isDarkMode ?
                <img src={DarkModeLogo} alt="Logo" className="w-16 h-15 rounded-full" />
                :
                <img src={Logo} alt="Logo" className="w-16 h-15 rounded-full" />
              }
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 dark:from-purple-300 dark:via-indigo-300 dark:to-purple-500 bg-clip-text text-transparent">
              Sortyx Smart Bin
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-purple-200 mt-2">
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'signup' && 'Create a new account'}
              {mode === 'forgot-password' && 'Reset your password'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error Alert */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert className="border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Success Alert */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert className="border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{success}</span>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Full Name (Sign Up only) */}
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-700 dark:text-purple-200">
                        Full Name *
                      </Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="pl-10 border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-purple-200">
                      Email Address *
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

                  {/* Password (Login & Sign Up) */}
                  {mode !== 'forgot-password' && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 dark:text-purple-200">
                        Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === 'signup' ? "Create a password (min. 6 characters)" : "Enter your password"}
                          className="pl-10 pr-10 border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator (Sign Up only) */}
                      {mode === 'signup' && password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-1"
                        >
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  level <= passwordStrength.strength
                                    ? `bg-${passwordStrength.color}-500`
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                                style={{
                                  backgroundColor: level <= passwordStrength.strength
                                    ? passwordStrength.color === 'red' ? '#ef4444'
                                    : passwordStrength.color === 'orange' ? '#f97316'
                                    : passwordStrength.color === 'yellow' ? '#eab308'
                                    : '#22c55e'
                                    : undefined
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Password strength: <span className="font-medium">{passwordStrength.label}</span>
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Confirm Password (Sign Up only) */}
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-purple-200">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          className="pl-10 pr-10 border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500 dark:text-red-400">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  )}

                  {/* Forgot Password Link (Login only) */}
                  {mode === 'login' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchMode('forgot-password')}
                        className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        {mode === 'login' && (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign In
                          </>
                        )}
                        {mode === 'signup' && (
                          <>
                            <UserIcon className="w-4 h-4 mr-2" />
                            Create Account
                          </>
                        )}
                        {mode === 'forgot-password' && (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Reset Link
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  {/* Back to Login (Forgot Password & Sign Up) */}
                  {mode !== 'login' && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => switchMode('login')}
                      className="w-full text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  )}
                </form>

                {/* Google Sign In & Sign Up Toggle (Login & Sign Up modes only) */}
                {mode !== 'forgot-password' && (
                  <>
                    <div className="relative my-6">
                      <Separator className="bg-gray-300 dark:bg-gray-600" />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#2A1F3D] px-3 text-sm text-gray-500 dark:text-gray-400">
                        or
                      </span>
                    </div>

                    {/* Google Sign In */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Chrome className="w-5 h-5 mr-2 text-[#4285F4]" />
                      {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                    </Button>

                    {/* Toggle Between Login and Sign Up */}
                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
                      {mode === 'login' ? (
                        <>
                          Don't have an account?{' '}
                          <button
                            type="button"
                            onClick={() => switchMode('signup')}
                            className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                          >
                            Sign up
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className="font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                          >
                            Sign in
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-sm text-gray-500 dark:text-purple-300"
        >
          Need help? Contact support at support@sortyx.com
        </motion.div>
      </motion.div>
    </div>
  );
}