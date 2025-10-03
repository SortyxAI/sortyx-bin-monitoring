import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, AlertTriangle, BarChart3, Activity, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StatsOverview({ activeSmartBins, criticalAlerts, avgFillLevel, totalCompartments }) {
  const stats = [
    {
      title: "Active SmartBins",
      value: activeSmartBins,
      icon: Trash2,
      trend: "+12%",
      subtitle: "from last month",
      color: {
        primary: "from-blue-500 to-cyan-400",
        liveColor: "#3b82f6",
        glow: "shadow-blue-500/20"
      },
      clickable: false
    },
    {
      title: "Critical Alerts",
      value: criticalAlerts,
      icon: AlertTriangle,
      trend: criticalAlerts > 0 ? "-8%" : "0%",
      subtitle: criticalAlerts > 0 ? "needs attention" : "all clear",
      color: {
        primary: "from-red-500 to-pink-400",
        liveColor: "#ef4444",
        glow: "shadow-red-500/20"
      },
      clickable: true,
      link: createPageUrl("Alerts")
    },
    {
      title: "Average Fill Level",
      value: `${avgFillLevel.toFixed(1)}%`,
      icon: BarChart3,
      trend: "+3.2%",
      subtitle: "efficiency up",
      color: {
        primary: "from-green-500 to-emerald-400",
        liveColor: "#10b981",
        glow: "shadow-green-500/20"
      },
      clickable: false
    },
    {
      title: "Total Compartments",
      value: totalCompartments,
      icon: Activity,
      trend: "+15%",
      subtitle: "capacity added",
      color: {
        primary: "from-purple-500 to-indigo-400",
        liveColor: "#a855f7",
        glow: "shadow-purple-500/20"
      },
      clickable: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      {stats.map((stat, index) => {
        const CardWrapper = stat.clickable ? Link : 'div';
        const wrapperProps = stat.clickable ? { to: stat.link } : {};

        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.1, 
              duration: 0.6,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              y: -8, 
              scale: 1.03,
              transition: { duration: 0.3 }
            }}
            className="group"
          >
            <CardWrapper {...wrapperProps} className={stat.clickable ? 'block' : ''}>
              <Card className={`relative overflow-hidden backdrop-blur-sm bg-white/60 dark:bg-[#241B3A]/80 border-2 border-purple-200/50 dark:border-purple-600/30 hover:shadow-2xl ${stat.color.glow} transition-all duration-500 h-full ${stat.clickable ? 'cursor-pointer' : ''}`}>
                {/* Live Status Indicator - Animated Wave Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ 
                      background: `linear-gradient(90deg, transparent 0%, ${stat.color.liveColor} 50%, transparent 100%)`,
                      width: '50%'
                    }}
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>

                {/* Animated background gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color.primary} opacity-5`} />
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)`
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0, 0.3, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>

                {/* Floating light particles */}
                <div className="absolute inset-0 overflow-hidden opacity-30">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1 h-1 bg-gradient-to-r ${stat.color.primary} rounded-full blur-sm`}
                      animate={{
                        x: [0, 60 * Math.cos(i), 0],
                        y: [0, -60 * Math.sin(i), 0],
                        opacity: [0, 1, 0],
                        scale: [0, 2, 0]
                      }}
                      transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: "easeInOut"
                      }}
                      style={{
                        left: `${50}%`,
                        top: `${50}%`
                      }}
                    />
                  ))}
                </div>

                <CardContent className="p-6 relative z-10">
                  {/* Header with icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={`relative p-3 rounded-2xl bg-gradient-to-br ${stat.color.primary} shadow-lg`}
                        whileHover={{ 
                          rotate: [0, -10, 10, 0],
                          scale: 1.1
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <stat.icon className="w-6 h-6 text-white drop-shadow-sm" />
                        
                        {/* Continuous pulsing ring */}
                        <motion.div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color.primary} opacity-30`}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0, 0.3]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                      
                      <div>
                        <motion.div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${stat.color.primary} bg-clip-text text-transparent`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 dark:text-green-400 font-bold">{stat.trend}</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Main value */}
                  <div className="mb-2">
                    <motion.div
                      className="text-4xl font-bold text-gray-900 dark:text-white mb-1"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        delay: index * 0.1 + 0.4, 
                        duration: 0.7,
                        type: "spring",
                        stiffness: 200
                      }}
                    >
                      <motion.span
                        key={stat.value}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        {stat.value}
                      </motion.span>
                    </motion.div>
                    
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {stat.title}
                    </h3>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.subtitle}
                    </p>
                  </div>
                </CardContent>

                {/* Decorative corner elements */}
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                  <motion.div
                    className={`w-full h-full bg-gradient-to-bl ${stat.color.primary} rounded-bl-full`}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5
                    }}
                  />
                </div>
                
                <div className="absolute bottom-0 left-0 w-16 h-16 opacity-5">
                  <motion.div
                    className={`w-full h-full bg-gradient-to-tr ${stat.color.primary} rounded-tr-full`}
                    animate={{
                      rotate: [0, 180, 360],
                      scale: [1, 0.8, 1]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
              </Card>
            </CardWrapper>
          </motion.div>
        );
      })}
    </div>
  );
}