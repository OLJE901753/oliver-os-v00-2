import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, MessageSquare } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

export const CollaborationWorkspace: React.FC = () => {
  const { isConnected, createThought, on, subscribe, unsubscribe } = useSocket()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [collaborativeThoughts, setCollaborativeThoughts] = useState<any[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isInSession, setIsInSession] = useState(false)

  useEffect(() => {
    // Listen for collaboration events
    on('collaboration:joined', (data) => {
      console.log('Joined collaboration session:', data)
      setSessionId(data.session_id)
      setParticipants(data.participants || [])
      setIsInSession(true)
    })

    on('collaboration:left', (data) => {
      console.log('Left collaboration session:', data)
      setSessionId(null)
      setParticipants([])
      setIsInSession(false)
    })

    on('collaboration:participant_joined', (data) => {
      console.log('Participant joined:', data)
      setParticipants(prev => [...prev, data.participant])
    })

    on('collaboration:participant_left', (data) => {
      console.log('Participant left:', data)
      setParticipants(prev => prev.filter(p => p.id !== data.participant_id))
    })

    on('collaboration:thought_shared', (data) => {
      console.log('Thought shared:', data)
      setCollaborativeThoughts(prev => [data.thought, ...prev])
    })

    on('collaboration:event', (data) => {
      console.log('Collaboration event:', data)
      // Handle real-time collaboration events like cursor position, selection, etc.
    })

    return () => {
      // Cleanup listeners
    }
  }, [on])

  const joinSession = (sessionId: string) => {
    subscribe(`collaboration:${sessionId}`)
    // In a real app, this would call an API to join the session
    console.log('Joining session:', sessionId)
  }

  const leaveSession = () => {
    if (sessionId) {
      unsubscribe(`collaboration:${sessionId}`)
      setSessionId(null)
      setParticipants([])
      setIsInSession(false)
    }
  }

  const shareThought = () => {
    if (!currentMessage.trim() || !isInSession) return

    createThought({
      content: currentMessage.trim(),
      user_id: 'anonymous',
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'collaboration',
        session_id: sessionId
      },
      tags: ['collaboration', 'shared']
    })

    setCurrentMessage('')
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Holographic Background Effect */}
      <div className="absolute inset-0 holographic-bg opacity-10"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 particle-field">
        {[...Array(16)].map((_, i) => (
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
            <Users className="w-12 h-12 text-lime-400 mx-auto" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-lime-400/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>
        <h1 className="text-4xl font-bold gradient-text mb-4 neon-text">
          Collaboration Workspace
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Real-time collaborative thinking with multiple minds connected.
        </p>
        <div className="flex items-center justify-center mt-6 space-x-3">
          <div className={`w-3 h-3 rounded-full animate-neon-pulse ${isConnected ? 'bg-lime-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <div className="w-1 h-1 bg-lime-400 rounded-full animate-neon-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Participants Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Users className="w-5 h-5 mr-2" />
                Participants ({participants.length})
              </h3>
              
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 glass-panel rounded-lg border border-lime-500/10"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-cyan-400 rounded-full flex items-center justify-center shadow-neon-lime">
                      <span className="text-white text-sm font-semibold">
                        {participant.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {participant.name || 'Anonymous'}
                      </p>
                      <p className="text-gray-400 text-xs flex items-center">
                        <div className="w-1 h-1 bg-lime-400 rounded-full mr-2 animate-neon-pulse"></div>
                        {participant.status || 'Active'}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {participants.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No participants yet
                  </p>
                )}
              </div>

              {/* Session Controls */}
              <div className="mt-6 space-y-3">
                {!isInSession ? (
                  <button
                    onClick={() => joinSession('demo-session')}
                    className="w-full neon-button text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                  >
                    Join Demo Session
                  </button>
                ) : (
                  <button
                    onClick={leaveSession}
                    className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all duration-300 border border-red-500/30 hover:border-red-500/50"
                  >
                    Leave Session
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Main Collaboration Area */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-8 border border-lime-500/20 shadow-neon-lime">
              <h2 className="text-3xl font-semibold text-lime-400 mb-6 flex items-center neon-text">
                <MessageSquare className="w-7 h-7 mr-3" />
                Shared Thoughts
              </h2>

              {/* Message Input */}
              <div className="mb-6">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Share a thought with the group..."
                      className="futuristic-input w-full"
                      disabled={!isInSession}
                      onKeyPress={(e) => e.key === 'Enter' && shareThought()}
                    />
                    <div className="absolute inset-0 rounded-lg bg-lime-400/5 pointer-events-none"></div>
                  </div>
                  <button
                    onClick={shareThought}
                    disabled={!currentMessage.trim() || !isInSession}
                    className="neon-button-secondary p-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Collaborative Thoughts */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {collaborativeThoughts.map((thought, index) => (
                  <motion.div
                    key={thought.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 glass-panel rounded-lg border border-lime-500/10"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-neon-lime">
                        <span className="text-white text-sm font-semibold">
                          {thought.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm mb-2">
                          {thought.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span className="flex items-center">
                            <div className="w-1 h-1 bg-lime-400 rounded-full mr-2 animate-neon-pulse"></div>
                            {thought.user?.name || 'Anonymous'}
                          </span>
                          <span>{new Date(thought.timestamp).toLocaleTimeString()}</span>
                          {thought.tags && (
                            <div className="flex space-x-1">
                              {thought.tags.map((tag: string, tagIndex: number) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-1 bg-lime-500/20 text-lime-400 rounded-full border border-lime-500/30 text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {collaborativeThoughts.length === 0 && (
                  <div className="text-center py-8">
                    <div className="relative mb-4">
                      <MessageSquare className="w-16 h-16 mx-auto text-gray-400 opacity-50" />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-lime-400/20 rounded-full blur-xl"
                      />
                    </div>
                    <p className="text-gray-400 text-sm">
                      {isInSession ? 'No shared thoughts yet' : 'Join a session to start collaborating'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}