import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Users, 
  Eye, 
  MessageSquare, 
  Mic, 
  MicOff, 
  Send, 
  Activity, 
  Cpu, 
  Network, 
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useThoughtStore } from '@/stores/thoughtStore'

export const BrainInterface: React.FC = () => {
  const { isConnected, createThought, on } = useSocket()
  const { thoughts, addThought, processingStatus, setProcessingStatus } = useThoughtStore()
  const [currentThought, setCurrentThought] = useState('')
  const [isProcessingState, setIsProcessingState] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [activeMode, setActiveMode] = useState<'think' | 'analyze' | 'create'>('think')
  const [neuralActivity, setNeuralActivity] = useState(0)
  const [focusLevel, setFocusLevel] = useState(85)

  // Simulate neural activity
  useEffect(() => {
    const interval = setInterval(() => {
      setNeuralActivity(prev => {
        const variation = (Math.random() - 0.5) * 20
        return Math.max(0, Math.min(100, prev + variation))
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Listen for thought processing updates
    on('thought:processed', (data) => {
      console.log('Thought processed:', data)
      addThought({
        content: data.data.content,
        processed: true,
        insights: data.data.insights || [],
        tags: data.data.tags || [],
        confidence: data.data.confidence,
        processingTime: data.data.processing_time_ms
      })
      setIsProcessingState(false)
      setProcessingStatus(null)
      setNeuralActivity(100) // Spike in activity
      setTimeout(() => setNeuralActivity(60), 2000)
    })

    on('thought:error', (data) => {
      console.error('Thought processing error:', data)
      setIsProcessingState(false)
      setProcessingStatus('Error processing thought')
    })

    on('thought:analyzed', (data) => {
      console.log('Thought analyzed:', data)
      // Update existing thought with analysis
      // This would require updating the thought store
    })

    on('agent:spawned', (data) => {
      console.log('Agent spawned:', data)
      setProcessingStatus(`Agent ${data.data.agent_type} is ready`)
    })

    on('voice:transcribed', (data) => {
      console.log('Voice transcribed:', data)
      setCurrentThought(data.data.transcription)
    })

    return () => {
      // Cleanup listeners
    }
  }, [on, addThought, setProcessingStatus])

  const handleThoughtSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentThought.trim() || isProcessingState) return

    setIsProcessingState(true)
    setProcessingStatus('Neural networks processing...')
    setNeuralActivity(95)
    
    createThought({
      content: currentThought.trim(),
      user_id: 'anonymous', // In a real app, this would come from auth
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'web_interface',
        mode: activeMode
      },
      tags: ['user_input', 'web', activeMode]
    })
    
    setCurrentThought('')
  }

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
        setNeuralActivity(80)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setCurrentThought(transcript)
        setIsRecording(false)
        
        // Also send to WebSocket for processing
        createThought({
          content: transcript,
          user_id: 'anonymous',
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'voice_input',
            mode: activeMode
          },
          tags: ['voice', 'speech_recognition', activeMode]
        })
      }

      recognition.onerror = () => {
        setIsRecording(false)
        setNeuralActivity(30)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'think': return Brain
      case 'analyze': return Cpu
      case 'create': return Sparkles
      default: return Brain
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'think': return 'lime'
      case 'analyze': return 'cyan'
      case 'create': return 'amber'
      default: return 'lime'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Holographic Background */}
      <div className="absolute inset-0 holographic-bg opacity-10"></div>
      
      {/* Floating Neural Particles */}
      <div className="absolute inset-0 particle-field">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-lime-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Neural Network Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center py-8"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-block mb-4"
        >
          <div className="relative">
            <Brain className="w-16 h-16 text-lime-400 mx-auto" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-lime-400/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>
        <h1 className="text-5xl font-bold gradient-text mb-2 neon-text">
          Neural Hub
        </h1>
        <p className="text-gray-300 text-lg">
          Your AI-powered mind organization command center
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Neural Interface */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            {/* Mode Selector */}
            <div className="glass-card p-6 mb-6 border border-lime-500/20 shadow-neon-lime">
              <h2 className="text-2xl font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Activity className="w-6 h-6 mr-3" />
                Neural Processing Modes
              </h2>
              <div className="flex space-x-4">
                {(['think', 'analyze', 'create'] as const).map((mode) => {
                  const ModeIcon = getModeIcon(mode)
                  const color = getModeColor(mode)
                  const isActive = activeMode === mode
                  
                  return (
                    <button
                      key={mode}
                      onClick={() => setActiveMode(mode)}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        isActive
                          ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/30 shadow-neon-${color}`
                          : 'bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30'
                      }`}
                    >
                      <ModeIcon className="w-5 h-5" />
                      <span className="capitalize">{mode}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Thought Input Interface */}
            <div className="glass-card p-8 border border-lime-500/20 shadow-neon-lime">
              <h2 className="text-3xl font-semibold text-lime-400 mb-6 flex items-center neon-text">
                <MessageSquare className="w-7 h-7 mr-3" />
                Neural Thought Input
              </h2>
              
              <form onSubmit={handleThoughtSubmit} className="space-y-6">
                {/* Enhanced Text Input */}
                <div className="relative">
                  <textarea
                    value={currentThought}
                    onChange={(e) => setCurrentThought(e.target.value)}
                    placeholder={`Enter your ${activeMode} thoughts... Let your mind flow freely.`}
                    className="futuristic-input w-full h-40 resize-none"
                    disabled={isProcessingState}
                  />
                  <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
                  {isProcessingState && (
                    <div className="absolute top-4 right-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={!currentThought.trim() || isProcessingState}
                    className="neon-button flex-1 py-4 px-8 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {isProcessingState ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Process Thought
                        </>
                      )}
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    disabled={isProcessingState}
                    className={`p-4 rounded-lg transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 shadow-neon-amber'
                        : 'neon-button-secondary'
                    }`}
                    title={isRecording ? 'Stop Recording' : 'Voice Input'}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                </div>
              </form>

              {/* Processing Status */}
              {isProcessingState && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-lime-500/10 border border-lime-500/30 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-center mb-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-lime-400 border-t-transparent rounded-full mr-3"
                    />
                    <span className="text-lime-300 font-medium">
                      {processingStatus || 'Neural networks analyzing...'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-lime-400 to-cyan-400 h-2 rounded-full shadow-neon-lime"
                      initial={{ width: 0 }}
                      animate={{ width: `${neuralActivity}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Neural Status Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Neural Activity Monitor */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Activity className="w-5 h-5 mr-2" />
                Neural Activity
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <div className="w-full bg-gray-700/50 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-lime-400 to-cyan-400 h-3 rounded-full shadow-neon-lime"
                      animate={{ width: `${neuralActivity}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-300 text-sm">Activity Level</span>
                    <span className="text-lime-400 font-semibold">{Math.round(neuralActivity)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Focus Level</span>
                  <span className="text-white font-semibold">{focusLevel}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isProcessingState 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : isConnected 
                        ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {isProcessingState ? 'Processing' : isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* System Stats */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Cpu className="w-5 h-5 mr-2" />
                System Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Thoughts Processed</span>
                  <span className="text-white font-semibold">{thoughts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Success Rate</span>
                  <span className="text-white font-semibold">
                    {thoughts.length > 0 ? Math.round((thoughts.filter(t => t.processed).length / thoughts.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg. Processing Time</span>
                  <span className="text-white font-semibold">
                    {thoughts.length > 0 
                      ? Math.round(thoughts.reduce((acc, t) => acc + (t.processingTime || 0), 0) / thoughts.length) + 'ms'
                      : '0ms'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Neural Activity */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Clock className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {thoughts.slice(-5).reverse().map((thought, index) => (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 glass-panel rounded-lg border border-lime-500/10"
                  >
                    <p className="text-sm text-gray-200 line-clamp-2 mb-2">
                      {thought.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {thought.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-lime-500/20 text-lime-400 text-xs rounded-full border border-lime-500/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(thought.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {thoughts.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No neural activity yet
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Target className="w-5 h-5 mr-2" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-lime-300 hover:bg-lime-500/10 rounded-lg transition-colors group">
                  <Eye className="w-5 h-5 group-hover:text-lime-400" />
                  <span>Visualize Mind</span>
                  <ChevronRight className="w-4 h-4 ml-auto group-hover:text-lime-400" />
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-lime-300 hover:bg-lime-500/10 rounded-lg transition-colors group">
                  <Users className="w-5 h-5 group-hover:text-lime-400" />
                  <span>Collaborate</span>
                  <ChevronRight className="w-4 h-4 ml-auto group-hover:text-lime-400" />
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-lime-300 hover:bg-lime-500/10 rounded-lg transition-colors group">
                  <Network className="w-5 h-5 group-hover:text-lime-400" />
                  <span>AI Agents</span>
                  <ChevronRight className="w-4 h-4 ml-auto group-hover:text-lime-400" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
