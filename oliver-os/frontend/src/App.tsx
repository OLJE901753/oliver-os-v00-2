import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { BrainInterface } from './components/brain-interface/BrainInterface'
import { CollaborationWorkspace } from './components/collaboration/CollaborationWorkspace'
import { MindVisualizer } from './components/visualization/MindVisualizer'
import { ThoughtProcessor } from './components/thought/ThoughtProcessor'
import { AIChat } from './components/ai-chat/AIChat'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { SocketProvider } from './hooks/useSocket'
import { initializeAuth } from './stores/authStore'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import SecondBrainApp from './components/SecondBrainApp'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// Futuristic placeholder components for coming soon pages
const FuturisticPlaceholder: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="min-h-screen bg-background text-foreground relative overflow-hidden"
  >
    {/* Holographic Background */}
    <div className="absolute inset-0 holographic-bg opacity-10"></div>
    
    {/* Floating Particles */}
    <div className="absolute inset-0 particle-field">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-neon-400 rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${8 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>

    <div className="relative z-10 flex items-center justify-center min-h-screen">
      <div className="glass-card p-12 text-center max-w-2xl mx-auto border border-neon-500/20 shadow-neon-blue">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <div className="relative">
            <div className="w-16 h-16 bg-neon-500/20 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 bg-neon-400 rounded-full animate-neon-pulse"></div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-neon-400/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>
        
        <h1 className="text-4xl font-bold gradient-text mb-4 neon-text">
          {title}
        </h1>
        <p className="text-gray-300 text-lg mb-8">
          {description}
        </p>
        
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center px-6 py-3 bg-neon-500/10 border border-neon-500/30 rounded-lg"
        >
          <div className="w-2 h-2 bg-neon-400 rounded-full mr-2 animate-neon-pulse"></div>
          <span className="text-neon-300 font-medium">Coming Soon</span>
        </motion.div>
      </div>
    </div>
  </motion.div>
)

function App() {
  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth()
  }, [])

  // For development: bypass authentication temporarily
  const isDevelopment = (import.meta as any).env?.DEV || false

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="w-screen h-screen bg-background text-foreground relative overflow-hidden" style={{ margin: 0, padding: 0 }}>

            {isDevelopment ? (
              // Development mode: show interface without auth
              <>
                <main className="relative z-10">
                  <Routes>
                    {/* Main Dashboard Routes */}
                    <Route path="/" element={<SecondBrainApp />} />
                    <Route path="/dashboard" element={<SecondBrainApp />} />
                    <Route path="/legacy" element={<BrainInterface />} />
                    
                    {/* Business Management Routes */}
                    <Route path="/clients" element={<FuturisticPlaceholder title="Client CRM" description="Advanced client management system with AI-powered insights and relationship tracking" />} />
                    <Route path="/clients/:id" element={<FuturisticPlaceholder title="Client Profile" description="Detailed client workspace with communication history and project tracking" />} />
                    <Route path="/tasks" element={<FuturisticPlaceholder title="Task Manager" description="AI-prioritized task management with intelligent scheduling and progress tracking" />} />
                    <Route path="/projects" element={<FuturisticPlaceholder title="Project Hub" description="Comprehensive project management system with collaborative workspaces" />} />
                    <Route path="/projects/:id" element={<FuturisticPlaceholder title="Project Detail" description="Individual project workspace with real-time collaboration and progress visualization" />} />
                    
                    {/* AI Systems Routes */}
                    <Route path="/ai-chat" element={<AIChat />} />
                    <Route path="/agents" element={<FuturisticPlaceholder title="AI Agents" description="Manage and interact with specialized AI agents for different tasks and workflows" />} />
                    
                    {/* Sharing & Social Routes */}
                    <Route path="/sharing" element={<FuturisticPlaceholder title="Shareable Views" description="Generate beautiful shareable links and screenshots of your mind maps and insights" />} />
                    <Route path="/portfolio" element={<FuturisticPlaceholder title="Public Portfolio" description="Create stunning public showcases of your work and achievements" />} />
                    
                    {/* Personal Development Routes */}
                    <Route path="/personal" element={<FuturisticPlaceholder title="Personal Dashboard" description="Track your mental and physical well-being with comprehensive analytics" />} />
                    <Route path="/health" element={<FuturisticPlaceholder title="Health & Biometrics" description="Monitor sleep patterns, heart rate variability, and overall health metrics" />} />
                    <Route path="/coaching" element={<FuturisticPlaceholder title="AI Coaching" description="Personalized AI coaching for productivity, creativity, and personal growth" />} />
                    <Route path="/voice-learn" element={<FuturisticPlaceholder title="Voice Learning" description="Voice-based learning system with natural language processing and adaptive feedback" />} />
                    
                    {/* Existing Routes */}
                    <Route path="/collaborate" element={<CollaborationWorkspace />} />
                    <Route path="/visualize" element={<MindVisualizer />} />
                    <Route path="/thoughts" element={<ThoughtProcessor />} />
                    
                    {/* Settings & Privacy */}
                    <Route path="/settings" element={<FuturisticPlaceholder title="Settings" description="Configure privacy settings, permissions, and customize your Oliver-OS experience" />} />
                    <Route path="/activity" element={<FuturisticPlaceholder title="Activity Feed" description="Real-time activity tracking and system monitoring dashboard" />} />
                  </Routes>
                </main>
              </>
            ) : (
              // Production mode: require authentication
              <ProtectedRoute>
                <main className="relative z-10">
                  <Routes>
                    {/* Main Dashboard Routes */}
                    <Route path="/" element={<SecondBrainApp />} />
                    <Route path="/dashboard" element={<SecondBrainApp />} />
                    <Route path="/legacy" element={<BrainInterface />} />
                    
                    {/* Business Management Routes */}
                    <Route path="/clients" element={<FuturisticPlaceholder title="Client CRM" description="Advanced client management system with AI-powered insights and relationship tracking" />} />
                    <Route path="/clients/:id" element={<FuturisticPlaceholder title="Client Profile" description="Detailed client workspace with communication history and project tracking" />} />
                    <Route path="/tasks" element={<FuturisticPlaceholder title="Task Manager" description="AI-prioritized task management with intelligent scheduling and progress tracking" />} />
                    <Route path="/projects" element={<FuturisticPlaceholder title="Project Hub" description="Comprehensive project management system with collaborative workspaces" />} />
                    <Route path="/projects/:id" element={<FuturisticPlaceholder title="Project Detail" description="Individual project workspace with real-time collaboration and progress visualization" />} />
                    
                    {/* AI Systems Routes */}
                    <Route path="/ai-chat" element={<AIChat />} />
                    <Route path="/agents" element={<FuturisticPlaceholder title="AI Agents" description="Manage and interact with specialized AI agents for different tasks and workflows" />} />
                    
                    {/* Sharing & Social Routes */}
                    <Route path="/sharing" element={<FuturisticPlaceholder title="Shareable Views" description="Generate beautiful shareable links and screenshots of your mind maps and insights" />} />
                    <Route path="/portfolio" element={<FuturisticPlaceholder title="Public Portfolio" description="Create stunning public showcases of your work and achievements" />} />
                    
                    {/* Personal Development Routes */}
                    <Route path="/personal" element={<FuturisticPlaceholder title="Personal Dashboard" description="Track your mental and physical well-being with comprehensive analytics" />} />
                    <Route path="/health" element={<FuturisticPlaceholder title="Health & Biometrics" description="Monitor sleep patterns, heart rate variability, and overall health metrics" />} />
                    <Route path="/coaching" element={<FuturisticPlaceholder title="AI Coaching" description="Personalized AI coaching for productivity, creativity, and personal growth" />} />
                    <Route path="/voice-learn" element={<FuturisticPlaceholder title="Voice Learning" description="Voice-based learning system with natural language processing and adaptive feedback" />} />
                    
                    {/* Existing Routes */}
                    <Route path="/collaborate" element={<CollaborationWorkspace />} />
                    <Route path="/visualize" element={<MindVisualizer />} />
                    <Route path="/thoughts" element={<ThoughtProcessor />} />
                    
                    {/* Settings & Privacy */}
                    <Route path="/settings" element={<FuturisticPlaceholder title="Settings" description="Configure privacy settings, permissions, and customize your Oliver-OS experience" />} />
                    <Route path="/activity" element={<FuturisticPlaceholder title="Activity Feed" description="Real-time activity tracking and system monitoring dashboard" />} />
                  </Routes>
                </main>
              </ProtectedRoute>
            )}
            
            {/* Futuristic Toast Notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(0 0% 4%)',
                  color: 'hsl(0 0% 100%)',
                  border: '1px solid hsl(195 100% 50% / 0.4)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)',
                  backdropFilter: 'blur(20px)',
                },
                success: {
                  iconTheme: {
                    primary: 'hsl(195 100% 50%)',
                    secondary: 'hsl(0 0% 100%)',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'hsl(0 63% 31%)',
                    secondary: 'hsl(0 0% 100%)',
                  },
                },
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </QueryClientProvider>
  )
}

export default App
