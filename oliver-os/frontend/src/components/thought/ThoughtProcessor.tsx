import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Send, 
  FileText, 
  Clock, 
  Brain,
  Zap,
  Tag,
  Lightbulb
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useThoughtStore } from '@/stores/thoughtStore'

interface ProcessingStatus {
  stage: string
  progress: number
  message: string
}

export const ThoughtProcessor: React.FC = () => {
  const { isConnected, emit, on } = useSocket()
  const { thoughts, addThought, setIsProcessing } = useThoughtStore()
  const [currentThought, setCurrentThought] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessingLocal] = useState(false)
  const [processingStage, setProcessingStage] = useState<ProcessingStatus | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  const availableTags = [
    'idea', 'question', 'problem', 'solution', 'memory', 'goal',
    'emotion', 'analysis', 'creative', 'technical', 'personal', 'work'
  ]

  useEffect(() => {
    // Check for voice support
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

    // Listen for processing updates
    on('thought-processing-started', (_data) => {
      setIsProcessingLocal(true)
      setIsProcessing(true)
      setProcessingStage({
        stage: 'analyzing',
        progress: 0,
        message: 'Starting analysis...'
      })
    })

    on('thought-processing-update', (data: ProcessingStatus) => {
      setProcessingStage(data)
    })

    on('thought-processing-complete', (data) => {
      addThought({
        content: data.thought.content,
        processed: true,
        insights: data.insights,
        tags: data.tags,
        confidence: data.confidence,
        processingTime: data.processingTime
      })
      setIsProcessingLocal(false)
      setIsProcessing(false)
      setProcessingStage(null)
      setCurrentThought('')
    })

    on('thought-processing-error', (error) => {
      console.error('Processing error:', error)
      setIsProcessingLocal(false)
      setIsProcessing(false)
      setProcessingStage(null)
    })

    return () => {
      // Cleanup
    }
  }, [on, addThought, setIsProcessing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentThought.trim() || isProcessing) return

    emit('process-thought', {
      thought: currentThought.trim(),
      tags: selectedTags,
      timestamp: new Date().toISOString()
    })
  }

  const handleVoiceInput = () => {
    if (!voiceSupported) return

    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
    } else {
      // Start recording
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setCurrentThought(prev => prev + (prev ? ' ' : '') + transcript)
        setIsRecording(false)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const getProcessingIcon = (stage: string) => {
    switch (stage) {
      case 'analyzing': return <Brain className="w-5 h-5" />
      case 'generating': return <Zap className="w-5 h-5" />
      case 'categorizing': return <Tag className="w-5 h-5" />
      case 'finalizing': return <Lightbulb className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-900 via-brain-800 to-brain-900">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block mb-4"
        >
          <MessageSquare className="w-12 h-12 text-thought-400 mx-auto" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Thought Processor
        </h1>
        <p className="text-brain-300">
          Input, process, and enhance your thoughts with AI-powered analysis
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Input Panel */}
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
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Text Input */}
                <div className="relative">
                  <textarea
                    value={currentThought}
                    onChange={(e) => setCurrentThought(e.target.value)}
                    placeholder="Share your thoughts... What's on your mind? Be as detailed as you want."
                    className="w-full h-40 bg-brain-700/50 border border-brain-600 rounded-xl p-4 text-white placeholder-brain-400 focus:outline-none focus:ring-2 focus:ring-thought-400 focus:border-transparent resize-none"
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

                {/* Tags Selection */}
                <div>
                  <label className="block text-sm font-medium text-brain-300 mb-3">
                    Tags (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-thought-500 text-white'
                            : 'bg-brain-700 text-brain-300 hover:bg-brain-600 hover:text-white'
                        }`}
                        disabled={isProcessing}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
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
                        <Send className="w-5 h-5 mr-2" />
                        Process Thought
                      </>
                    )}
                  </button>
                  
                  {voiceSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      disabled={isProcessing}
                      className={`p-3 rounded-xl transition-colors duration-200 ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-brain-700 hover:bg-brain-600 text-white'
                      }`}
                      title={isRecording ? 'Stop Recording' : 'Voice Input'}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </form>

              {/* Processing Status */}
              {processingStage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-thought-500/10 border border-thought-500/20 rounded-xl"
                >
                  <div className="flex items-center mb-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-thought-400 border-t-transparent rounded-full mr-3"
                    />
                    <span className="text-thought-300 font-medium">
                      {processingStage.message}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    {getProcessingIcon(processingStage.stage)}
                    <span className="text-sm text-thought-400 capitalize">
                      {processingStage.stage}
                    </span>
                  </div>
                  
                  <div className="w-full bg-brain-700/50 rounded-full h-2">
                    <motion.div
                      className="bg-thought-400 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${processingStage.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Side Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Processing Stats */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-thought-400" />
                Processing Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Total Processed</span>
                  <span className="text-white font-semibold">{thoughts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Success Rate</span>
                  <span className="text-white font-semibold">
                    {thoughts.length > 0 ? Math.round((thoughts.filter(t => t.processed).length / thoughts.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Avg. Processing Time</span>
                  <span className="text-white font-semibold">
                    {thoughts.length > 0 
                      ? Math.round(thoughts.reduce((acc, t) => acc + (t.processingTime || 0), 0) / thoughts.length) + 'ms'
                      : '0ms'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isProcessing 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : isConnected 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isProcessing ? 'Processing' : isConnected ? 'Ready' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Thoughts */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-thought-400" />
                Recent Thoughts
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {thoughts.slice(-5).reverse().map((thought, index) => (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-brain-700/30 rounded-lg border border-brain-600/30"
                  >
                    <p className="text-sm text-brain-200 line-clamp-2 mb-2">
                      {thought.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {thought.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-thought-500/20 text-thought-400 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-brain-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(thought.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {thoughts.length === 0 && (
                  <p className="text-brain-400 text-sm text-center py-4">
                    No thoughts processed yet
                  </p>
                )}
              </div>
            </div>

            {/* Voice Settings */}
            {voiceSupported && (
              <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Mic className="w-5 h-5 mr-2 text-thought-400" />
                  Voice Input
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-brain-300">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isRecording ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {isRecording ? 'Recording' : 'Ready'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brain-300">Language</span>
                    <span className="text-white text-sm">English (US)</span>
                  </div>
                  <button
                    onClick={handleVoiceInput}
                    disabled={isProcessing}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-brain-700 hover:bg-brain-600 text-white'
                    }`}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
