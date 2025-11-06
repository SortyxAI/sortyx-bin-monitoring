import React, { useState, useEffect } from 'react';
import Layout from "./Layout.jsx";
import Login from "./Login.jsx";
import Register from './Register.jsx';

import Dashboard from "./Dashboard";
import SmartBins from "./SmartBins";
import Alerts from "./Alerts";
import Admin from "./Admin";
import Users from "./Users";
import Profile from "./Profile";
import Reports from "./Reports";
import SystemSettings from "./SystemSettings";
import NotificationGateways from "./NotificationGateways";
import APIGuide from "./APIGuide";
import SubscriptionPlans from "./SubscriptionPlans";
import Pricing from "./Pricing";
import PaymentGateways from "./PaymentGateways";
import FirebaseSetup from "./FirebaseSetup";
import Impersonate from "./Impersonate";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { User } from '../api/entities';

const PAGES = {
    
    Dashboard: Dashboard,
    
    SmartBins: SmartBins,
    
    Alerts: Alerts,
    
    Admin: Admin,
    
    Users: Users,
    
    Profile: Profile,
    
    Reports: Reports,
    
    SystemSettings: SystemSettings,
    
    NotificationGateways: NotificationGateways,
    
    APIGuide: APIGuide,
    
    SubscriptionPlans: SubscriptionPlans,
    
    Pricing: Pricing,
    
    PaymentGateways: PaymentGateways,
    
    FirebaseSetup: FirebaseSetup,
    
    Impersonate: Impersonate,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegister, setIsRegister] = useState(false);
    
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const userData = await User.me();
                    setUser(userData);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('auth_token');
                }
            }
            setLoading(false);
        };
        
        checkAuth();
    }, []);
    
    const handleLogin = (userData) => {
        setUser(userData);
        setIsRegister(false);
    };
    
    const handleLogout = () => {
        User.logout();
        setUser(null);
        setIsRegister(false);
    };

    const handleNavigateToLogin = () => {
        setIsRegister(false);
    };

    const handleNavigateToRegister = () => {
        setIsRegister(true);
    }
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }
    
    if (!user) {
        // return <Login onLogin={handleLogin} />;
        // 🔑 Authentication Barrier: If not logged in, show Login OR Register
        if (isRegister) {
            // User is trying to register, pass the login handler to redirect to dashboard on success
            return <Register 
                       onLogin={handleLogin} 
                       onNavigateToLogin={handleNavigateToLogin} 
                   />;
        } else {
            // User is trying to login (default view)
            return <Login 
                       onLogin={handleLogin} 
                       onNavigateToRegister={handleNavigateToRegister} // Pass new handler to switch to register
                   />;
        }
    }
    
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage} user={user} onLogout={handleLogout}>
            <Routes>            
                <Route path="/" element={<Dashboard />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/SmartBins" element={<SmartBins />} />
                <Route path="/Alerts" element={<Alerts />} />
                <Route path="/Admin" element={<Admin />} />
                <Route path="/Users" element={<Users />} />
                <Route path="/Profile" element={<Profile />} />
                <Route path="/Reports" element={<Reports />} />
                <Route path="/SystemSettings" element={<SystemSettings />} />
                <Route path="/NotificationGateways" element={<NotificationGateways />} />
                <Route path="/APIGuide" element={<APIGuide />} />
                <Route path="/SubscriptionPlans" element={<SubscriptionPlans />} />
                <Route path="/Pricing" element={<Pricing />} />
                <Route path="/PaymentGateways" element={<PaymentGateways />} />
                <Route path="/FirebaseSetup" element={<FirebaseSetup />} />
                <Route path="/Impersonate" element={<Impersonate />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}