import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Lightbulb,
  Save,
  Download,
  Upload,
  Filter,
  Search,
  Star,
  Bookmark,
  Share2,
  Copy,
  Edit3,
  Trash2,
  Archive,
  TrendingUp,
  Activity,
  Target,
  Sparkles
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence'>('newest')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedThought, setSelectedThought] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
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

  // Enhanced utility functions
  const getAllTags = (): string[] => {
    const allTags = new Set<string>()
    thoughts.forEach(thought => {
      thought.tags?.forEach(tag => allTags.add(tag))
    })
    return Array.from(allTags)
  }

  const getFilteredThoughts = () => {
    let filtered = thoughts.filter(thought => {
      const matchesSearch = !searchTerm || thought.content.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTags = filterTags.length === 0 || filterTags.some(tag => thought.tags?.includes(tag))
      return matchesSearch && matchesTags
    })

    // Sort thoughts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        case 'confidence':
          return (b.confidence || 0) - (a.confidence || 0)
        default:
          return 0
      }
    })

    return filtered
  }

  const copyThought = (content: string) => {
    navigator.clipboard.writeText(content)
    // Could add toast notification
  }

  const startEditing = (thought: any) => {
    setSelectedThought(thought)
    setIsEditing(true)
    setEditContent(thought.content)
  }

  const saveEdit = () => {
    if (selectedThought && editContent.trim()) {
      // In a real app, this would update the thought in the store/backend
      console.log('Saving edit:', editContent)
      setIsEditing(false)
      setSelectedThought(null)
      setEditContent('')
    }
  }

  const archiveThought = (thoughtId: string) => {
    // In a real app, this would archive the thought
    console.log('Archiving thought:', thoughtId)
  }

  const deleteThought = (thoughtId: string) => {
    // In a real app, this would delete the thought
    console.log('Deleting thought:', thoughtId)
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Holographic Background Effect */}
      <div className="absolute inset-0 holographic-bg opacity-10"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 particle-field">
        {[...Array(12)].map((_, i) => (
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

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8 relative z-10"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block mb-4"
        >
          <div className="relative">
            <MessageSquare className="w-12 h-12 text-lime-400 mx-auto" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-lime-400/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>
        <h1 className="text-4xl font-bold gradient-text mb-2 neon-text">
          Thought Processor
        </h1>
        <p className="text-gray-300">
          Input, process, and enhance your thoughts with AI-powered analysis
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Input Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-8 border border-lime-500/20 shadow-neon-lime">
              <h2 className="text-3xl font-semibold text-lime-400 mb-6 flex items-center neon-text">
                <MessageSquare className="w-7 h-7 mr-3" />
                Thought Input
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Text Input */}
                <div className="relative">
                  <textarea
                    value={currentThought}
                    onChange={(e) => setCurrentThought(e.target.value)}
                    placeholder="Share your thoughts... What's on your mind? Be as detailed as you want."
                    className="futuristic-input w-full h-40 resize-none"
                    disabled={isProcessing}
                  />
                  <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
                  {isProcessing && (
                    <div className="absolute top-4 right-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full"
                      />
                    </div>
                  )}
                </div>

                {/* Tags Selection */}
                <div>
                  <label className="block text-sm font-medium text-lime-300 mb-3 flex items-center">
                    <div className="w-1 h-1 bg-lime-400 rounded-full mr-2 animate-neon-pulse"></div>
                    Tags (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                          selectedTags.includes(tag)
                            ? 'bg-lime-500 text-white border border-lime-400 shadow-neon-lime'
                            : 'bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30'
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
                    className="neon-button flex-1 py-3 px-6 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center">
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
                    </span>
                  </button>
                  
                  {voiceSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      disabled={isProcessing}
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        isRecording
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 shadow-neon-amber'
                          : 'neon-button-secondary'
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
                  className="mt-6 p-4 bg-lime-500/10 border border-lime-500/30 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-center mb-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-lime-400 border-t-transparent rounded-full mr-3"
                    />
                    <span className="text-lime-300 font-medium">
                      {processingStage.message}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-lime-400">
                      {getProcessingIcon(processingStage.stage)}
                    </div>
                    <span className="text-sm text-lime-400 capitalize">
                      {processingStage.stage}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-lime-400 to-cyan-400 h-2 rounded-full shadow-neon-lime"
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
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Brain className="w-5 h-5 mr-2" />
                Processing Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Processed</span>
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isProcessing 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : isConnected 
                        ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {isProcessing ? 'Processing' : isConnected ? 'Ready' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Recent Thoughts */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-lime-400 flex items-center neon-text">
                  <FileText className="w-5 h-5 mr-2" />
                  Recent Thoughts
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
                    className="p-1 text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 rounded transition-colors"
                    title={`Sort by ${sortBy === 'newest' ? 'oldest' : 'newest'}`}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="p-1 text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 rounded transition-colors"
                    title={showArchived ? 'Show active' : 'Show archived'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="mb-4 space-y-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search thoughts..."
                  className="futuristic-input w-full text-sm"
                />
                <div className="flex flex-wrap gap-1">
                  {getAllTags().slice(0, 4).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setFilterTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        )
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                        filterTags.includes(tag)
                          ? 'bg-lime-500 text-white border border-lime-400 shadow-neon-lime'
                          : 'bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {getFilteredThoughts().slice(0, 5).map((thought, index) => (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 glass-panel rounded-lg border border-lime-500/10 group hover:border-lime-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-200 line-clamp-2 flex-1">
                        {thought.content}
                      </p>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyThought(thought.content)}
                          className="p-1 text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 rounded transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => startEditing(thought)}
                          className="p-1 text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => archiveThought(thought.id)}
                          className="p-1 text-gray-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
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
                        {thought.confidence && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full border border-cyan-500/30">
                            {Math.round(thought.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(thought.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {getFilteredThoughts().length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    {searchTerm || filterTags.length > 0 ? 'No matching thoughts' : 'No thoughts processed yet'}
                  </p>
                )}
              </div>
            </div>

            {/* Voice Settings */}
            {voiceSupported && (
              <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
                <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                  <Mic className="w-5 h-5 mr-2" />
                  Voice Input
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {isRecording ? 'Recording' : 'Ready'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Language</span>
                    <span className="text-white text-sm">English (US)</span>
                  </div>
                  <button
                    onClick={handleVoiceInput}
                    disabled={isProcessing}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                        : 'neon-button-secondary'
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

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && selectedThought && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl glass-card p-6 border border-lime-500/20 shadow-neon-lime"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Edit3 className="w-6 h-6 mr-3" />
                Edit Thought
              </h3>
              
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="futuristic-input w-full h-32 resize-none mb-4"
                placeholder="Edit your thought..."
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={saveEdit}
                  className="neon-button px-6 py-2 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
