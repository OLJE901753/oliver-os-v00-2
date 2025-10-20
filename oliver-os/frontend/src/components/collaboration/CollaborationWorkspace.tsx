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
    <div className="min-h-screen bg-gradient-to-br from-brain-900 via-brain-800 to-brain-900">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Collaboration Workspace
        </h1>
        <p className="text-brain-300 text-lg max-w-2xl mx-auto">
          Real-time collaborative thinking with multiple minds connected.
        </p>
        <div className="flex items-center justify-center mt-4 space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-brain-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Participants Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-thought-400" />
                Participants ({participants.length})
              </h3>
              
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-brain-700/30 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-thought-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {participant.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {participant.name || 'Anonymous'}
                      </p>
                      <p className="text-brain-400 text-xs">
                        {participant.status || 'Active'}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {participants.length === 0 && (
                  <p className="text-brain-400 text-sm text-center py-4">
                    No participants yet
                  </p>
                )}
              </div>

              {/* Session Controls */}
              <div className="mt-6 space-y-3">
                {!isInSession ? (
                  <button
                    onClick={() => joinSession('demo-session')}
                    className="w-full bg-thought-500 hover:bg-thought-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Join Demo Session
                  </button>
                ) : (
                  <button
                    onClick={leaveSession}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
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
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-8 border border-brain-700/50">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-thought-400" />
                Shared Thoughts
              </h2>

              {/* Message Input */}
              <div className="mb-6">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Share a thought with the group..."
                    className="flex-1 bg-brain-700/50 border border-brain-600 rounded-xl p-4 text-white placeholder-brain-400 focus:outline-none focus:ring-2 focus:ring-thought-400 focus:border-transparent"
                    disabled={!isInSession}
                    onKeyPress={(e) => e.key === 'Enter' && shareThought()}
                  />
                  <button
                    onClick={shareThought}
                    disabled={!currentMessage.trim() || !isInSession}
                    className="bg-thought-500 hover:bg-thought-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-xl transition-colors duration-200"
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
                    className="p-4 bg-brain-700/30 rounded-lg border border-brain-600/30"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-thought-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {thought.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm mb-2">
                          {thought.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-brain-400">
                          <span>{thought.user?.name || 'Anonymous'}</span>
                          <span>{new Date(thought.timestamp).toLocaleTimeString()}</span>
                          {thought.tags && (
                            <div className="flex space-x-1">
                              {thought.tags.map((tag: string, tagIndex: number) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-1 bg-thought-500/20 text-thought-300 rounded"
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
                  <p className="text-brain-400 text-sm text-center py-8">
                    {isInSession ? 'No shared thoughts yet' : 'Join a session to start collaborating'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}