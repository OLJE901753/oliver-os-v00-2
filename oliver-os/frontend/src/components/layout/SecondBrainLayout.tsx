import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  FileText, 
  CheckSquare, 
  Network, 
  Search, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Zap,
  Cpu,
  Activity,
  Target,
  Sparkles,
  Mic,
  MicOff,
  Command
} from 'lucide-react'

interface SecondBrainLayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

const SecondBrainLayout: React.FC<SecondBrainLayoutProps> = ({ 
  children, 
  currentPage, 
  onPageChange 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [neuralActivity, setNeuralActivity] = useState(75)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 8
    }))
    setParticles(newParticles)
  }, [])

  // Simulate neural activity
  useEffect(() => {
    const interval = setInterval(() => {
      setNeuralActivity(prev => {
        const variation = (Math.random() - 0.5) * 20
        return Math.max(0, Math.min(100, prev + variation))
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const navigationItems = [
    {
      id: 'neural-hub',
      label: 'Neural Hub',
      icon: Brain,
      description: 'Main dashboard',
      color: 'neon'
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: FileText,
      description: 'Thought capture',
      color: 'electric'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      description: 'Task management',
      color: 'holographic'
    },
    {
      id: 'knowledge-graph',
      label: 'Knowledge Graph',
      icon: Network,
      description: 'Mind mapping',
      color: 'neon'
    },
    {
      id: 'search',
      label: 'AI Search',
      icon: Search,
      description: 'Intelligent search',
      color: 'electric'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Analytics & insights',
      color: 'holographic'
    }
  ]

  const quickActions = [
    { icon: Zap, label: 'Quick Capture', shortcut: 'Ctrl+K' },
    { icon: Cpu, label: 'AI Process', shortcut: 'Ctrl+J' },
    { icon: Activity, label: 'Neural Sync', shortcut: 'Ctrl+S' },
    { icon: Target, label: 'Focus Mode', shortcut: 'Ctrl+F' }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'neon':
        return 'text-neon-400 border-neon-500/30 hover:border-neon-500/50 hover:bg-neon-500/10 shadow-neon-blue'
      case 'electric':
        return 'text-electric-400 border-electric-500/30 hover:border-electric-500/50 hover:bg-electric-500/10 shadow-neon-electric'
      case 'holographic':
        return 'text-holographic-400 border-holographic-500/30 hover:border-holographic-500/50 hover:bg-holographic-500/10 shadow-neon-holographic'
      default:
        return 'text-neon-400 border-neon-500/30 hover:border-neon-500/50 hover:bg-neon-500/10 shadow-neon-blue'
    }
  }

  const handleVoiceCommand = () => {
    setIsListening(!isListening)
    // Voice command logic would go here
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Global Holographic Background */}
      <div className="fixed inset-0 holographic-bg opacity-5 pointer-events-none"></div>
      
      {/* Neural Network Background */}
      <div className="fixed inset-0 neural-network-bg opacity-10 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="fixed inset-0 particle-field pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-neon-400 rounded-full opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Top Action Bar */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-neon-500/20"
      >
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-neon-400 hover:text-neon-300 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </motion.button>
            
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <Brain className="w-8 h-8 text-neon-400 glow-neon" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-neon-400/20 rounded-full blur-xl"
                />
              </motion.div>
              <div>
                <h1 className="text-xl font-orbitron font-bold gradient-text">
                  Second Brain
                </h1>
                <p className="text-sm text-gray-400">AI-Powered Mind Interface</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center space-x-2">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="wireframe-button text-xs px-3 py-2"
                title={`${action.label} (${action.shortcut})`}
              >
                <action.icon className="w-4 h-4 mr-2" />
                {action.label}
              </motion.button>
            ))}
          </div>

          {/* Voice Command & Settings */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVoiceCommand}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isListening 
                  ? 'bg-neon-500 text-black shadow-neon-blue' 
                  : 'text-neon-400 hover:bg-neon-500/10 border border-neon-500/30'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-neon-400 hover:bg-neon-500/10 border border-neon-500/30 rounded-lg transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Neural Activity Indicator */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-neon-400" />
              <span className="text-sm text-gray-300">Neural Activity</span>
            </div>
            <div className="flex-1 bg-black/20 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-neon-500 to-electric-500 rounded-full"
                style={{ width: `${neuralActivity}%` }}
                animate={{ width: `${neuralActivity}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm text-neon-400 font-orbitron">
              {Math.round(neuralActivity)}%
            </span>
          </div>
        </div>
      </motion.header>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 z-40 glass-card border-r border-neon-500/20"
          >
            <div className="p-6">
              {/* Close Button */}
              <div className="flex justify-end mb-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-neon-400 hover:text-neon-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navigationItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onPageChange(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                      currentPage === item.id 
                        ? getColorClasses(item.color)
                        : `text-gray-300 border-gray-500/30 hover:${getColorClasses(item.color).split(' ')[0]} hover:${getColorClasses(item.color).split(' ')[1]}`
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-400">{item.description}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </nav>

              {/* System Status */}
              <div className="mt-8 p-4 wireframe-card">
                <h3 className="text-sm font-orbitron text-neon-400 mb-3">System Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Neural Processing</span>
                    <span className="text-neon-400">Active</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">AI Agents</span>
                    <span className="text-electric-400">3 Online</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Memory Usage</span>
                    <span className="text-holographic-400">67%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'ml-0'} pt-24`}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SecondBrainLayout
