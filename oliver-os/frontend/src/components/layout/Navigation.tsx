import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Users, 
  Eye, 
  MessageSquare, 
  Menu, 
  X, 
  Settings,
  User,
  LogOut
} from 'lucide-react'

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navigationItems = [
    { path: '/', label: 'Brain Interface', icon: Brain },
    { path: '/collaborate', label: 'Collaborate', icon: Users },
    { path: '/visualize', label: 'Visualize', icon: Eye },
    { path: '/thoughts', label: 'Thoughts', icon: MessageSquare },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-brain-800/80 backdrop-blur-sm border-b border-brain-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Brain className="w-8 h-8 text-thought-400" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-thought-400/20 rounded-full blur-sm"
              />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white group-hover:text-thought-300 transition-colors">
                Oliver-OS
              </h1>
              <p className="text-xs text-brain-400 group-hover:text-brain-300 transition-colors">
                AI Brain Interface
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'text-thought-400 bg-thought-500/10'
                      : 'text-brain-300 hover:text-white hover:bg-brain-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-thought-500/10 rounded-lg border border-thought-500/20"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* User Menu & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="p-2 text-brain-400 hover:text-white hover:bg-brain-700/50 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2 px-3 py-2 bg-brain-700/50 rounded-lg">
                <User className="w-5 h-5 text-thought-400" />
                <span className="text-sm text-white">User</span>
              </div>
              <button className="p-2 text-brain-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-brain-400 hover:text-white hover:bg-brain-700/50 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-brain-800/95 backdrop-blur-sm border-t border-brain-700/50"
          >
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-thought-400 bg-thought-500/10 border border-thought-500/20'
                        : 'text-brain-300 hover:text-white hover:bg-brain-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              {/* Mobile User Actions */}
              <div className="pt-4 border-t border-brain-700/50 space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-brain-300 hover:text-white hover:bg-brain-700/50 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-brain-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
