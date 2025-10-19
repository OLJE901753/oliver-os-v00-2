import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, MessageCircle, MousePointer, Eye, EyeOff } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface Collaborator {
  id: string
  name: string
  color: string
  cursor: { x: number; y: number }
  isActive: boolean
  lastSeen: string
}

export const CollaborationWorkspace: React.FC = () => {
  const { isConnected, emit, on } = useSocket()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [newCollaboratorName, setNewCollaboratorName] = useState('')
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)

  useEffect(() => {
    // Listen for collaborator updates
    on('collaborator-joined', (data: Collaborator) => {
      setCollaborators(prev => [...prev, data])
    })

    on('collaborator-left', (data: { id: string }) => {
      setCollaborators(prev => prev.filter(c => c.id !== data.id))
    })

    on('collaborator-updated', (data: Collaborator) => {
      setCollaborators(prev => 
        prev.map(c => c.id === data.id ? { ...c, ...data } : c)
      )
    })

    on('cursor-moved', (data: { id: string; cursor: { x: number; y: number } }) => {
      setCollaborators(prev =>
        prev.map(c => 
          c.id === data.id 
            ? { ...c, cursor: data.cursor, isActive: true }
            : c
        )
      )
    })

    // Request current collaborators
    emit('get-collaborators')

    return () => {
      // Cleanup
    }
  }, [on, emit])

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollaboratorName.trim()) return

    const newCollaborator: Collaborator = {
      id: crypto.randomUUID(),
      name: newCollaboratorName.trim(),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      cursor: { x: 0, y: 0 },
      isActive: true,
      lastSeen: new Date().toISOString(),
    }

    emit('add-collaborator', newCollaborator)
    setNewCollaboratorName('')
    setIsAddingCollaborator(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isVisible) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const cursor = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    emit('cursor-moved', { cursor })
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
          <Users className="w-12 h-12 text-thought-400 mx-auto" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Collaboration Workspace
        </h1>
        <p className="text-brain-300">
          Work together in real-time with shared thoughts and insights
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Workspace */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50 h-96 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2 text-thought-400" />
                  Shared Workspace
                </h2>
                <button
                  onClick={() => setIsVisible(!isVisible)}
                  className="p-2 text-brain-400 hover:text-white hover:bg-brain-700/50 rounded-lg transition-colors"
                >
                  {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Workspace Area */}
              <div
                className="w-full h-80 bg-brain-700/30 rounded-xl border-2 border-dashed border-brain-600/50 relative overflow-hidden"
                onMouseMove={handleMouseMove}
              >
                {isVisible && collaborators.map((collaborator) => (
                  <motion.div
                    key={collaborator.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: collaborator.isActive ? 1 : 0.5,
                      scale: collaborator.isActive ? 1 : 0.8,
                      x: collaborator.cursor.x,
                      y: collaborator.cursor.y,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute pointer-events-none"
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg"
                        style={{ backgroundColor: collaborator.color }}
                      >
                        {collaborator.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center mt-1">
                        <MousePointer className="w-4 h-4 text-white" style={{ color: collaborator.color }} />
                        <span className="text-xs text-white ml-1 font-medium">
                          {collaborator.name}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Placeholder Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-brain-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Start collaborating</p>
                    <p className="text-sm">Move your mouse to see your cursor</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Collaborators Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Active Collaborators */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-thought-400" />
                Active Collaborators
              </h3>
              
              <div className="space-y-3">
                {collaborators.map((collaborator, index) => (
                  <motion.div
                    key={collaborator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      collaborator.isActive 
                        ? 'bg-thought-500/10 border border-thought-500/20' 
                        : 'bg-brain-700/30'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: collaborator.color }}
                    >
                      {collaborator.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{collaborator.name}</p>
                      <p className="text-xs text-brain-400">
                        {collaborator.isActive ? 'Active now' : `Last seen ${new Date(collaborator.lastSeen).toLocaleTimeString()}`}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      collaborator.isActive ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </motion.div>
                ))}

                {collaborators.length === 0 && (
                  <p className="text-brain-400 text-sm text-center py-4">
                    No collaborators yet
                  </p>
                )}
              </div>
            </div>

            {/* Add Collaborator */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-thought-400" />
                Add Collaborator
              </h3>

              {!isAddingCollaborator ? (
                <button
                  onClick={() => setIsAddingCollaborator(true)}
                  className="w-full bg-thought-500/10 hover:bg-thought-500/20 border border-thought-500/20 text-thought-400 hover:text-thought-300 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add New Collaborator
                </button>
              ) : (
                <form onSubmit={handleAddCollaborator} className="space-y-3">
                  <input
                    type="text"
                    value={newCollaboratorName}
                    onChange={(e) => setNewCollaboratorName(e.target.value)}
                    placeholder="Collaborator name"
                    className="w-full bg-brain-700/50 border border-brain-600 rounded-lg p-3 text-white placeholder-brain-400 focus:outline-none focus:ring-2 focus:ring-thought-400 focus:border-transparent"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 bg-thought-500 hover:bg-thought-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCollaborator(false)
                        setNewCollaboratorName('')
                      }}
                      className="flex-1 bg-brain-700 hover:bg-brain-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Connection Status */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Connection Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">WebSocket</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Collaborators</span>
                  <span className="text-white font-semibold">{collaborators.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Active</span>
                  <span className="text-white font-semibold">
                    {collaborators.filter(c => c.isActive).length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
