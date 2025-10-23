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
  LogOut,
  Briefcase,
  Activity,
  Heart,
  Mic,
  Share2,
  Zap,
  ChevronDown,
  Sparkles,
  Cpu,
  Network
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { UserProfile } from '../auth/UserProfile'

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const location = useLocation()
  const { user, logout, isLoading } = useAuthStore()

  // Organized navigation sections for better mind organization
  const navigationSections = [
    {
      id: 'core',
      label: 'Core',
      icon: Brain,
      color: 'lime',
      items: [
        { path: '/', label: 'Neural Hub', icon: Brain, description: 'Main dashboard' },
        { path: '/ai-chat', label: 'AI Chat', icon: MessageSquare, description: 'Conversational AI' },
        { path: '/thoughts', label: 'Thoughts', icon: Cpu, description: 'Process ideas' },
      ]
    },
    {
      id: 'business',
      label: 'Business',
      icon: Briefcase,
      color: 'cyan',
      items: [
        { path: '/clients', label: 'Clients', icon: Users, description: 'CRM system' },
        { path: '/tasks', label: 'Tasks', icon: Zap, description: 'Task management' },
        { path: '/projects', label: 'Projects', icon: Network, description: 'Project hub' },
      ]
    },
    {
      id: 'ai',
      label: 'AI Systems',
      icon: Sparkles,
      color: 'amber',
      items: [
        { path: '/agents', label: 'Agents', icon: Activity, description: 'AI agents' },
        { path: '/visualize', label: 'Visualize', icon: Eye, description: 'Mind maps' },
        { path: '/collaborate', label: 'Collaborate', icon: Users, description: 'Team work' },
      ]
    },
    {
      id: 'personal',
      label: 'Personal',
      icon: Heart,
      color: 'lime',
      items: [
        { path: '/personal', label: 'Personal', icon: Heart, description: 'Personal dashboard' },
        { path: '/health', label: 'Health', icon: Activity, description: 'Biometrics' },
        { path: '/coaching', label: 'Coaching', icon: Mic, description: 'AI coaching' },
      ]
    },
    {
      id: 'social',
      label: 'Social',
      icon: Share2,
      color: 'cyan',
      items: [
        { path: '/sharing', label: 'Sharing', icon: Share2, description: 'Share views' },
        { path: '/portfolio', label: 'Portfolio', icon: Eye, description: 'Public showcase' },
      ]
    }
  ]

  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'lime':
        return {
          bg: 'bg-lime-500/10',
          border: 'border-lime-500/30',
          text: 'text-lime-400',
          hover: 'hover:bg-lime-500/20 hover:border-lime-500/50',
          glow: 'shadow-neon-lime'
        }
      case 'cyan':
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          hover: 'hover:bg-cyan-500/20 hover:border-cyan-500/50',
          glow: 'shadow-neon-cyan'
        }
      case 'amber':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          hover: 'hover:bg-amber-500/20 hover:border-amber-500/50',
          glow: 'shadow-neon-amber'
        }
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          hover: 'hover:bg-gray-500/20 hover:border-gray-500/50',
          glow: ''
        }
    }
  }

  return (
    <nav className="glass-panel sticky top-0 z-50 backdrop-blur-glass border-b border-lime-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Brain className="w-8 h-8 text-lime-400" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-lime-400/20 rounded-full blur-sm"
              />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white group-hover:text-lime-300 transition-colors neon-text">
                Oliver-OS
              </h1>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                Neural Operating System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation - Organized by Sections */}
          <div className="hidden lg:flex items-center space-x-2">
            {navigationSections.map((section) => {
              const SectionIcon = section.icon
              const colors = getColorClasses(section.color)
              const isExpanded = expandedSection === section.id
              
              return (
                <div key={section.id} className="relative">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${colors.bg} ${colors.border} ${colors.text} ${colors.hover} ${isExpanded ? colors.glow : ''}`}
                  >
                    <SectionIcon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-64 glass-card border border-lime-500/20 shadow-neon-lime rounded-lg overflow-hidden"
                      >
                        <div className="p-2">
                          {section.items.map((item) => {
                            const ItemIcon = item.icon
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setExpandedSection(null)}
                                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-300 group ${
                                  isActive(item.path)
                                    ? `${colors.bg} ${colors.border} ${colors.text} ${colors.glow}`
                                    : 'hover:bg-lime-500/10 hover:text-lime-300 text-gray-300'
                                }`}
                              >
                                <ItemIcon className="w-5 h-5" />
                                <div className="flex-1">
                                  <div className="font-medium">{item.label}</div>
                                  <div className="text-xs text-gray-400 group-hover:text-gray-300">
                                    {item.description}
                                  </div>
                                </div>
                                {isActive(item.path) && (
                                  <motion.div
                                    layoutId="activeIndicator"
                                    className="w-2 h-2 bg-lime-400 rounded-full animate-neon-pulse"
                                  />
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* User Menu & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-lime-500/10 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="flex items-center space-x-2 px-3 py-2 bg-lime-500/10 rounded-lg hover:bg-lime-500/20 transition-colors border border-lime-500/30 hover:shadow-neon-lime"
              >
                <User className="w-5 h-5 text-lime-400" />
                <span className="text-sm text-white">{user?.name || 'User'}</span>
              </button>
              <button 
                onClick={handleLogout}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-lime-500/10 rounded-lg transition-colors"
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
            className="lg:hidden glass-panel border-t border-lime-500/20"
          >
            <div className="px-4 py-4 space-y-4">
              {navigationSections.map((section) => {
                const SectionIcon = section.icon
                const colors = getColorClasses(section.color)
                
                return (
                  <div key={section.id} className="space-y-2">
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${colors.bg} ${colors.border} ${colors.text}`}>
                      <SectionIcon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </div>
                    <div className="ml-4 space-y-1">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                              isActive(item.path)
                                ? `${colors.bg} ${colors.border} ${colors.text}`
                                : 'hover:bg-lime-500/10 hover:text-lime-300 text-gray-300'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                            <div className="flex-1">
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-400">{item.description}</div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              
              {/* Mobile User Actions */}
              <div className="pt-4 border-t border-lime-500/20 space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-lime-500/10 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{isLoading ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showUserProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUserProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <UserProfile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
