import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
// import { Logo } from "@/assets/Logo.jpeg"
import Logo from "@/assets/Logo.jpeg"
import DarkModeLogo from "@/assets/Logo-darkmode.jpeg"
// Remove DevToolsDropdown import
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Bell, 
  User as UserIcon,
  Menu,
  X,
  Trash2,
  Moon,
  Sun,
  BarChart3,
  CreditCard,
  UserCog,
  Shield,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "SmartBins",
    url: createPageUrl("SmartBins"),
    icon: Trash2,
  },
  {
    title: "Alerts",
    url: createPageUrl("Alerts"),
    icon: Bell,
  },
  {
    title: "Reports",
    url: createPageUrl("Reports"),
    icon: BarChart3,
  },
  {
    title: "Pricing",
    url: createPageUrl("Pricing"),
    icon: CreditCard,
  },
];

const adminItems = [
  {
    title: "Admin",
    url: createPageUrl("Admin"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  const [impersonatedUser, setImpersonatedUser] = useState(null);

  useEffect(() => {
    loadUser();
    checkImpersonation();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const checkImpersonation = () => {
    const stored = localStorage.getItem('impersonatedUser');
    if (stored) {
      setImpersonatedUser(JSON.parse(stored));
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.log("User not authenticated");
    }
  };

  const handleLogout = async () => {
    // Clear impersonation on logout
    localStorage.removeItem('impersonatedUser');
    await User.logout();
    window.location.reload();
  };

  const handleStopImpersonation = () => {
    localStorage.removeItem('impersonatedUser');
    window.location.reload();
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0818] transition-colors duration-500">
      <style>{`
        :root {
          --primary: 139 92 246;
          --primary-foreground: 255 255 255;
          --secondary: 244 244 245;
          --background: 255 255 255;
          --foreground: 9 9 11;
          --card: 255 255 255;
          --card-foreground: 9 9 11;
          --muted: 244 244 245;
          --muted-foreground: 113 113 122;
          --border: 229 229 229;
        }
        
        .dark {
          --primary: 167 139 250;
          --primary-foreground: 255 255 255;
          --secondary: 55 48 78;
          --background: 15 8 24;
          --foreground: 255 255 255;
          --card: 36 27 58;
          --card-foreground: 255 255 255;
          --muted: 55 48 78;
          --muted-foreground: 209 213 219;
          --border: 55 48 78;
        }
        
        * {
          border-color: rgb(var(--border));
        }
      `}</style>

      {/* Impersonation Banner */}
      {isAdmin && impersonatedUser && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white py-2 px-4 shadow-lg"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="w-5 h-5" />
              </motion.div>
              <span className="font-semibold text-sm">
                ADMIN MODE: Viewing as {impersonatedUser.full_name || impersonatedUser.email}
              </span>
              <Avatar className="w-6 h-6 border-2 border-white">
                <AvatarImage src={impersonatedUser.profile_photo} />
                <AvatarFallback className="text-xs bg-orange-300 text-orange-900">
                  {impersonatedUser.full_name?.[0] || impersonatedUser.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStopImpersonation}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4 mr-1" />
              Exit Impersonation
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:bg-gradient-to-r dark:from-[#1F0F2E] dark:via-[#2A1F3D] dark:to-[#241B3A] backdrop-blur-md border-b border-purple-100 dark:border-purple-800/50 sticky top-0 z-50 transition-colors duration-300 dark:shadow-2xl dark:shadow-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              {/* <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 rounded-xl flex items-center justify-center shadow-lg dark:shadow-purple-500/20">
                <Trash2 className="w-6 h-6 text-white" />
              </div> */}
              <div className="flex-wrap w-10 h-10 items-center justify-center">
                {isDarkMode ? (
                  <img src={DarkModeLogo} alt="Sortyx Logo" className="block w-10 h-10 rounded-full shadow-lg pb-0" />
                ) : 
                (<img src={Logo} alt="Sortyx Logo" className="block w-10 h-10 rounded-full shadow-lg pb-0" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
                  Sortyx
                </h1>
                <p className="text-xs text-gray-500 dark:text-purple-200/70 leading-none">SmartBin Monitoring</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => (
                <motion.div key={item.title} whileHover={{ y: -2 }}>
                  <Link
                    to={item.url}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      location.pathname === item.url
                        ? 'text-white shadow-lg'
                        : 'text-gray-700 dark:text-purple-200 hover:text-purple-700 dark:hover:text-purple-100'
                    }`}
                  >
                    {location.pathname === item.url && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-lg shadow-md"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">
                      <item.icon className={`w-4 h-4 ${location.pathname === item.url ? 'text-white' : 'text-purple-600 dark:text-purple-300'}`} />
                    </span>
                    <span className="relative z-10">
                      {item.title}
                    </span>
                  </Link>
                </motion.div>
              ))}
              
              {isAdmin && adminItems.map((item) => (
                 <motion.div key={item.title} whileHover={{ y: -2 }}>
                  <Link
                    to={item.url}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      location.pathname === item.url
                        ? 'text-white shadow-lg'
                        : 'text-gray-700 dark:text-purple-200 hover:text-purple-700 dark:hover:text-purple-100'
                    }`}
                  >
                    {location.pathname === item.url && (
                      <motion.div
                        layoutId="active-nav-pill-admin"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-lg shadow-md"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">
                      <item.icon className={`w-4 h-4 ${location.pathname === item.url ? 'text-white' : 'text-purple-600 dark:text-purple-300'}`} />
                    </span>
                    <span className="relative z-10">
                      {item.title}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Remove DevTools Dropdown */}

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-full"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={isDarkMode ? "moon" : "sun"}
                      initial={{ y: -20, opacity: 0, rotate: -90 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: 20, opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isDarkMode ? (
                        <Sun className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Moon className="w-5 h-5 text-purple-600" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 rounded-full p-1 h-auto relative">
                      {impersonatedUser && (
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-gray-800"
                        />
                      )}
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={impersonatedUser?.profile_photo || user.profile_photo} />
                        <AvatarFallback className="bg-gradient-to-tr from-purple-600 to-indigo-600 text-white">
                          {(impersonatedUser?.full_name || user.full_name)?.[0] || (impersonatedUser?.email || user.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* <span className="hidden md:block text-sm font-medium text-gray-900 dark:text-purple-100">
                        {impersonatedUser ? (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-orange-500" />
                            {impersonatedUser.full_name || impersonatedUser.email}
                          </span>
                        ) : (
                          user.full_name || user.email
                        )}
                      </span> */}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="dark:bg-[#2A1F3D] dark:border-purple-700">
                    {impersonatedUser && isAdmin && (
                      <>
                        <div className="px-2 py-1.5 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                          IMPERSONATING USER
                        </div>
                        <DropdownMenuItem 
                          onClick={handleStopImpersonation}
                          className="text-orange-600 dark:text-orange-400"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Stop Impersonation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="dark:bg-purple-700" />
                      </>
                    )}
                    <Link to={createPageUrl("Profile")}>
                      <DropdownMenuItem className="dark:text-purple-100 dark:hover:bg-purple-500/20 dark:hover:text-white">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator className="dark:bg-purple-700" />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="text-red-600 dark:text-red-400 dark:hover:bg-purple-500/20"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => User.login()} className="bg-purple-600 hover:bg-purple-700">
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0F0818] border-t border-purple-100 dark:border-purple-800">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === item.url
                      ? 'bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-200'
                      : 'text-gray-600 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
              
              {isAdmin && adminItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === item.url
                      ? 'bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-200'
                      : 'text-gray-600 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-[#1F0F2E] border-t border-gray-200 dark:border-purple-800/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-purple-200">
              Powered by © 2025 <span className="font-medium bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">Sortyx Ventures Pvt Ltd.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
