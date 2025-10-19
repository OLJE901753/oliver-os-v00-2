import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, Users, Eye, MessageSquare } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useThoughtStore } from '@/stores/thoughtStore'

export const BrainInterface: React.FC = () => {
  const { isConnected, emit, on } = useSocket()
  const { thoughts, addThought, processingStatus } = useThoughtStore()
  const [currentThought, setCurrentThought] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Listen for thought processing updates
    on('thought-processed', (data) => {
      addThought(data.thought)
      setIsProcessing(false)
    })

    on('processing-status', (status) => {
      setIsProcessing(status.isProcessing)
    })

    return () => {
      // Cleanup listeners
    }
  }, [on, addThought])

  const handleThoughtSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentThought.trim() || isProcessing) return

    setIsProcessing(true)
    emit('process-thought', { 
      thought: currentThought.trim(),
      timestamp: new Date().toISOString()
    })
    setCurrentThought('')
  }

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setCurrentThought(transcript)
      }

      recognition.start()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-900 via-brain-800 to-brain-900">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <Brain className="w-16 h-16 text-thought-400 mx-auto" />
        </motion.div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Oliver-OS Brain Interface
        </h1>
        <p className="text-brain-300 text-lg max-w-2xl mx-auto">
          Connect your thoughts to the collective intelligence. Process, visualize, and collaborate in real-time.
        </p>
        <div className="flex items-center justify-center mt-4 space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-brain-400">
            {isConnected ? 'Connected to AI Brain' : 'Disconnected'}
          </span>
        </div>
      </motion.div>

      {/* Main Interface */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thought Input Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-8 border border-brain-700/50">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-thought-400" />
                Thought Input
              </h2>
              
              <form onSubmit={handleThoughtSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    value={currentThought}
                    onChange={(e) => setCurrentThought(e.target.value)}
                    placeholder="Share your thoughts... What's on your mind?"
                    className="w-full h-32 bg-brain-700/50 border border-brain-600 rounded-xl p-4 text-white placeholder-brain-400 focus:outline-none focus:ring-2 focus:ring-thought-400 focus:border-transparent resize-none"
                    disabled={isProcessing}
                  />
                  {isProcessing && (
                    <div className="absolute top-4 right-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-thought-400 border-t-transparent rounded-full"
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={!currentThought.trim() || isProcessing}
                    className="flex-1 bg-gradient-to-r from-thought-500 to-thought-600 hover:from-thought-600 hover:to-thought-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center"
                  >
                    {isProcessing ? (
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
                        <Zap className="w-5 h-5 mr-2" />
                        Process Thought
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className="bg-brain-700 hover:bg-brain-600 text-white p-3 rounded-xl transition-colors duration-200"
                    title="Voice Input"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Processing Status */}
              {isProcessing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-thought-500/10 border border-thought-500/20 rounded-xl"
                >
                  <div className="flex items-center text-thought-300">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="w-2 h-2 bg-thought-400 rounded-full mr-3"
                    />
                    <span className="text-sm font-medium">
                      {processingStatus || 'Analyzing your thought...'}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Quick Stats Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Connection Status */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-thought-400" />
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">AI Brain</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isConnected ? 'Active' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Thoughts Processed</span>
                  <span className="text-white font-semibold">{thoughts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Processing</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isProcessing ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {isProcessing ? 'Active' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Thoughts */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-thought-400" />
                Recent Thoughts
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {thoughts.slice(-5).reverse().map((thought, index) => (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-brain-700/30 rounded-lg border border-brain-600/30"
                  >
                    <p className="text-sm text-brain-200 line-clamp-2">
                      {thought.content}
                    </p>
                    <p className="text-xs text-brain-400 mt-1">
                      {new Date(thought.timestamp).toLocaleTimeString()}
                    </p>
                  </motion.div>
                ))}
                {thoughts.length === 0 && (
                  <p className="text-brain-400 text-sm text-center py-4">
                    No thoughts processed yet
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-thought-400" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-brain-700/30 hover:bg-brain-700/50 rounded-lg transition-colors duration-200 group">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-3 text-thought-400 group-hover:text-thought-300" />
                    <span className="text-brain-200 group-hover:text-white">Collaborate</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-brain-700/30 hover:bg-brain-700/50 rounded-lg transition-colors duration-200 group">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-3 text-thought-400 group-hover:text-thought-300" />
                    <span className="text-brain-200 group-hover:text-white">Visualize</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
