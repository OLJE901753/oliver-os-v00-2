import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Mic, 
  MicOff, 
  Loader2, 
  Sparkles, 
  Zap, 
  Brain, 
  MessageSquare, 
  Settings, 
  MoreVertical,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isTyping?: boolean
  processingTime?: number
  confidence?: number
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI neural assistant. I'm here to help organize your thoughts and provide intelligent insights. How can I assist your mind today?",
      role: 'assistant',
      timestamp: new Date(),
      confidence: 0.95
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [aiPersonality, setAiPersonality] = useState<'analytical' | 'creative' | 'supportive'>('analytical')
  const [conversationMode, setConversationMode] = useState<'chat' | 'brainstorm' | 'analyze'>('chat')
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setIsTyping(true)

    // Simulate AI response with personality
    setTimeout(() => {
      const responses = {
        analytical: `Analyzing your input: "${userMessage.content}". Based on neural pattern analysis, I can provide structured insights and logical breakdowns.`,
        creative: `What an interesting thought! "${userMessage.content}" - Let me explore this creatively and suggest innovative approaches.`,
        supportive: `I understand your perspective on "${userMessage.content}". Let me help you work through this with empathy and encouragement.`
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[aiPersonality],
        role: 'assistant',
        timestamp: new Date(),
        processingTime: Math.random() * 1000 + 500,
        confidence: Math.random() * 0.3 + 0.7
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
      setIsTyping(false)
    }, 1500 + Math.random() * 1000)
  }

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    // Could add a toast notification here
  }

  const regenerateResponse = (messageId: string) => {
    // Find the user message that prompted this response
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === 'user') {
        // Remove the current AI response and regenerate
        setMessages(prev => prev.filter(m => m.id !== messageId))
        // Trigger new response
        setTimeout(() => {
          const responses = {
            analytical: `Let me re-analyze: "${userMessage.content}". Here's a different analytical perspective...`,
            creative: `Reimagining "${userMessage.content}" - here's a fresh creative angle...`,
            supportive: `Let me approach "${userMessage.content}" from a different supportive angle...`
          }

          const aiMessage: Message = {
            id: Date.now().toString(),
            content: responses[aiPersonality],
            role: 'assistant',
            timestamp: new Date(),
            processingTime: Math.random() * 1000 + 500,
            confidence: Math.random() * 0.3 + 0.7
          }
          setMessages(prev => [...prev, aiMessage])
        }, 1000)
      }
    }
  }

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'analytical': return Brain
      case 'creative': return Sparkles
      case 'supportive': return MessageSquare
      default: return Bot
    }
  }

  const getPersonalityColor = (personality: string) => {
    switch (personality) {
      case 'analytical': return 'cyan'
      case 'creative': return 'amber'
      case 'supportive': return 'lime'
      default: return 'lime'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Holographic Background */}
      <div className="absolute inset-0 holographic-bg opacity-10"></div>
      
      {/* Floating AI Particles */}
      <div className="absolute inset-0 particle-field">
        {[...Array(15)].map((_, i) => (
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

      {/* AI Chat Header */}
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
            <Bot className="w-16 h-16 text-lime-400 mx-auto" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-lime-400/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>
        <h1 className="text-5xl font-bold gradient-text mb-2 neon-text">
          AI Neural Assistant
        </h1>
        <p className="text-gray-300 text-lg">
          Conversational AI powered by advanced neural networks
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Chat Interface */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            {/* AI Personality & Mode Selector */}
            <div className="glass-card p-6 mb-6 border border-lime-500/20 shadow-neon-lime">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-lime-400 flex items-center neon-text">
                  <Sparkles className="w-6 h-6 mr-3" />
                  AI Configuration
                </h2>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex space-x-4">
                {(['analytical', 'creative', 'supportive'] as const).map((personality) => {
                  const PersonalityIcon = getPersonalityIcon(personality)
                  const color = getPersonalityColor(personality)
                  const isActive = aiPersonality === personality
                  
                  return (
                    <button
                      key={personality}
                      onClick={() => setAiPersonality(personality)}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        isActive
                          ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/30 shadow-neon-${color}`
                          : 'bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30'
                      }`}
                    >
                      <PersonalityIcon className="w-5 h-5" />
                      <span className="capitalize">{personality}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chat Container */}
            <div className="glass-card border border-lime-500/20 shadow-neon-lime h-[calc(100vh-300px)] flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-2xl ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-lime-500 text-black shadow-neon-lime' 
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        
                        {/* Message Content */}
                        <div className={`px-6 py-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-lime-500/20 text-white border border-lime-500/30 shadow-neon-lime'
                            : 'bg-gray-500/20 text-gray-100 border border-gray-500/30 backdrop-blur-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          
                          {/* Message Metadata */}
                          <div className="flex items-center justify-between mt-3 text-xs">
                            <span className={`${
                              message.role === 'user' ? 'text-lime-300' : 'text-gray-400'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            
                            {message.role === 'assistant' && (
                              <div className="flex items-center space-x-2">
                                {message.confidence && (
                                  <span className="text-gray-400">
                                    Confidence: {Math.round(message.confidence * 100)}%
                                  </span>
                                )}
                                {message.processingTime && (
                                  <span className="text-gray-400">
                                    {Math.round(message.processingTime)}ms
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Message Actions */}
                          {message.role === 'assistant' && (
                            <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-500/20">
                              <button
                                onClick={() => copyMessage(message.content)}
                                className="p-1 text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 rounded transition-colors"
                                title="Copy message"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => regenerateResponse(message.id)}
                                className="p-1 text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 rounded transition-colors"
                                title="Regenerate response"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-lime-300 hover:bg-lime-500/10 rounded transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="bg-gray-500/20 text-gray-100 border border-gray-500/30 backdrop-blur-sm px-6 py-4 rounded-2xl">
                        <div className="flex items-center space-x-2">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="w-2 h-2 bg-lime-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-lime-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-lime-400 rounded-full"
                          />
                          <span className="text-sm text-gray-300 ml-2">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-lime-500/20 p-6">
                <form onSubmit={handleSendMessage} className="flex space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Ask your ${aiPersonality} AI assistant anything...`}
                      className="futuristic-input w-full px-6 py-4 pr-16"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      disabled={isLoading || isRecording}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
                        isRecording 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-neon-amber' 
                          : 'text-gray-400 hover:text-lime-300 hover:bg-lime-500/10'
                      }`}
                      title={isRecording ? 'Stop Recording' : 'Voice Input'}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="neon-button px-8 py-4 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>

          {/* AI Status Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* AI Status */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Bot className="w-5 h-5 mr-2" />
                AI Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Status</span>
                  <span className="px-3 py-1 bg-lime-500/20 text-lime-400 border border-lime-500/30 rounded-full text-xs font-medium">
                    Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Personality</span>
                  <span className="text-white font-semibold capitalize">{aiPersonality}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Mode</span>
                  <span className="text-white font-semibold capitalize">{conversationMode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Messages</span>
                  <span className="text-white font-semibold">{messages.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Zap className="w-5 h-5 mr-2" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-lime-300 hover:bg-lime-500/10 rounded-lg transition-colors group">
                  <Brain className="w-5 h-5 group-hover:text-lime-400" />
                  <span>Clear Conversation</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-lime-300 hover:bg-lime-500/10 rounded-lg transition-colors group">
                  <MessageSquare className="w-5 h-5 group-hover:text-lime-400" />
                  <span>Export Chat</span>
                </button>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-lime-300 hover:bg-lime-500/10 rounded-lg transition-colors group"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5 group-hover:text-lime-400" /> : <VolumeX className="w-5 h-5 group-hover:text-lime-400" />}
                  <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card p-6 border border-lime-500/20 shadow-neon-lime"
                >
                  <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                    <Settings className="w-5 h-5 mr-2" />
                    Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-lime-300 mb-2">Response Speed</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        defaultValue="3"
                        className="w-full futuristic-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-lime-300 mb-2">Creativity Level</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        defaultValue="7"
                        className="w-full futuristic-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-lime-300 mb-2">Memory Length</label>
                      <select className="w-full futuristic-input">
                        <option>Short (5 messages)</option>
                        <option>Medium (20 messages)</option>
                        <option>Long (50 messages)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
