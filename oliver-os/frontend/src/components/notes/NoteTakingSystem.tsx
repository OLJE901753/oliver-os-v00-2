import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Tag, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Mic, 
  MicOff,
  Sparkles,
  Brain,
  Zap,
  Clock,
  Star,
  Archive,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  isStarred: boolean
  isArchived: boolean
  aiInsights: string[]
  confidence: number
}

interface NoteTakingSystemProps {
  className?: string
}

const NoteTakingSystem: React.FC<NoteTakingSystemProps> = ({ className = '' }) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'confidence'>('newest')
  const [showArchived, setShowArchived] = useState(false)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [newNote, setNewNote] = useState({ title: '', content: '' })

  // Sample notes for demonstration
  useEffect(() => {
    const sampleNotes: Note[] = [
      {
        id: '1',
        title: 'Neural Network Architecture',
        content: 'Exploring the potential of creating a second brain interface that can process thoughts in real-time. The key is to establish strong neural pathways between different knowledge domains.',
        tags: ['AI', 'Architecture', 'Neural Networks'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        isStarred: true,
        isArchived: false,
        aiInsights: ['High potential for knowledge synthesis', 'Consider implementing graph-based connections'],
        confidence: 0.92
      },
      {
        id: '2',
        title: 'Project Ideas for 2024',
        content: 'Building a holographic interface for mind mapping. The goal is to create an immersive experience where thoughts can be visualized as interconnected nodes in 3D space.',
        tags: ['Projects', 'UI/UX', 'Holographic'],
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14'),
        isStarred: false,
        isArchived: false,
        aiInsights: ['Feasible with current WebGL technology', 'Consider VR integration'],
        confidence: 0.87
      },
      {
        id: '3',
        title: 'Meeting Notes - AI Team',
        content: 'Discussed the implementation of voice-to-text capabilities and real-time thought processing. Need to focus on reducing latency and improving accuracy.',
        tags: ['Meetings', 'AI', 'Voice Processing'],
        createdAt: new Date('2024-01-13'),
        updatedAt: new Date('2024-01-13'),
        isStarred: false,
        isArchived: false,
        aiInsights: ['Priority: Latency reduction', 'Consider edge computing solutions'],
        confidence: 0.78
      }
    ]
    setNotes(sampleNotes)
  }, [])

  const getAllTags = () => {
    const allTags = notes.flatMap(note => note.tags)
    return Array.from(new Set(allTags))
  }

  const getFilteredNotes = () => {
    return notes.filter(note => {
      const matchesSearch = !searchTerm || 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTags = filterTags.length === 0 || 
        filterTags.some(tag => note.tags.includes(tag))
      
      const matchesArchive = showArchived ? note.isArchived : !note.isArchived
      
      return matchesSearch && matchesTags && matchesArchive
    }).sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case 'oldest':
          return a.updatedAt.getTime() - b.updatedAt.getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'confidence':
          return b.confidence - a.confidence
        default:
          return 0
      }
    })
  }

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isStarred: false,
      isArchived: false,
      aiInsights: [],
      confidence: 0.5
    }

    setNotes(prev => [note, ...prev])
    setNewNote({ title: '', content: '' })
    setIsAIGenerating(true)

    // Simulate AI processing
    setTimeout(() => {
      const updatedNote = {
        ...note,
        aiInsights: [
          'Consider adding relevant tags',
          'High potential for knowledge connection',
          'Content shows strong analytical thinking'
        ],
        confidence: 0.85
      }
      setNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n))
      setIsAIGenerating(false)
    }, 2000)
  }

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
    ))
  }

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id))
    if (selectedNote?.id === id) {
      setSelectedNote(null)
    }
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    // Voice input logic would go here
  }

  const handleAIGenerate = async (content: string) => {
    setIsAIGenerating(true)
    // Simulate AI processing
    setTimeout(() => {
      setIsAIGenerating(false)
    }, 1500)
  }

  return (
    <div className={`h-full flex ${className}`}>
      {/* Notes List Sidebar */}
      <div className="w-1/3 border-r border-neon-500/20 glass-panel">
        <div className="p-4 border-b border-neon-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-orbitron text-neon-400 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Notes
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedNote(null)}
              className="p-2 text-neon-400 hover:bg-neon-500/10 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes..."
                className="wireframe-input w-full pl-10 pr-4 py-2 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showArchived 
                    ? 'bg-neon-500 text-black' 
                    : 'text-neon-400 border border-neon-500/30 hover:bg-neon-500/10'
                }`}
              >
                <Archive className="w-4 h-4" />
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="wireframe-input text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
                <option value="confidence">Confidence</option>
              </select>
            </div>

            {/* Tag Filters */}
            <div className="flex flex-wrap gap-1">
              {getAllTags().slice(0, 5).map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setFilterTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )
                  }}
                  className={`px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                    filterTags.includes(tag)
                      ? 'bg-neon-500 text-black shadow-neon-blue'
                      : 'bg-neon-500/20 text-neon-400 border border-neon-500/30 hover:bg-neon-500/30'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {getFilteredNotes().map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedNote(note)}
              className={`p-4 border-b border-neon-500/10 cursor-pointer transition-all duration-200 ${
                selectedNote?.id === note.id 
                  ? 'bg-neon-500/10 border-neon-500/30' 
                  : 'hover:bg-neon-500/5'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-white text-sm line-clamp-1">
                  {note.title}
                </h3>
                <div className="flex items-center space-x-1">
                  {note.isStarred && <Star className="w-3 h-3 text-amber-400 fill-current" />}
                  <span className="text-xs text-neon-400">
                    {Math.round(note.confidence * 100)}%
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-300 line-clamp-2 mb-2">
                {note.content}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {note.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-neon-500/20 text-neon-400 text-xs rounded-full border border-neon-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  {note.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          /* Note Editor */
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-neon-500/20 glass-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-orbitron text-neon-400">
                    {isEditing ? 'Edit Note' : 'View Note'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateNote(selectedNote.id, { isStarred: !selectedNote.isStarred })}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        selectedNote.isStarred 
                          ? 'text-amber-400' 
                          : 'text-gray-400 hover:text-amber-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${selectedNote.isStarred ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 text-neon-400 hover:bg-neon-500/10 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleVoiceInput}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isRecording 
                        ? 'bg-neon-500 text-black shadow-neon-blue' 
                        : 'text-neon-400 border border-neon-500/30 hover:bg-neon-500/10'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleAIGenerate(selectedNote.content)}
                    disabled={isAIGenerating}
                    className="p-2 text-holographic-400 hover:bg-holographic-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
                    className="wireframe-input w-full"
                    placeholder="Note title..."
                  />
                  <textarea
                    ref={textareaRef}
                    value={selectedNote.content}
                    onChange={(e) => handleUpdateNote(selectedNote.id, { content: e.target.value })}
                    className="wireframe-input w-full h-64 resize-none"
                    placeholder="Write your thoughts..."
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="neon-button px-4 py-2 text-sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h1 className="text-2xl font-orbitron text-white">
                    {selectedNote.title}
                  </h1>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedNote.content}
                    </p>
                  </div>
                  
                  {/* AI Insights */}
                  {selectedNote.aiInsights.length > 0 && (
                    <div className="glass-panel p-4 rounded-lg">
                      <h3 className="text-sm font-orbitron text-holographic-400 mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        AI Insights
                      </h3>
                      <div className="space-y-2">
                        {selectedNote.aiInsights.map((insight, index) => (
                          <div key={index} className="text-sm text-gray-300 flex items-start">
                            <Zap className="w-3 h-3 text-electric-400 mr-2 mt-0.5 flex-shrink-0" />
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-neon-500/20 text-neon-400 text-sm rounded-full border border-neon-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* New Note Creation */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full glass-card p-8 rounded-xl">
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <div className="w-16 h-16 bg-neon-500/20 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-neon-400" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-orbitron text-neon-400 mb-2">
                  Capture Your Thoughts
                </h2>
                <p className="text-gray-300">
                  Start a new note and let AI help you organize your ideas
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Note title..."
                  className="wireframe-input w-full"
                />
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your thoughts here..."
                  className="wireframe-input w-full h-32 resize-none"
                />
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateNote}
                    disabled={!newNote.title.trim() || !newNote.content.trim() || isAIGenerating}
                    className="neon-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAIGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 mr-2"
                        >
                          <Brain className="w-4 h-4" />
                        </motion.div>
                        AI Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Note
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVoiceInput}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      isRecording 
                        ? 'bg-neon-500 text-black shadow-neon-blue' 
                        : 'text-neon-400 border border-neon-500/30 hover:bg-neon-500/10'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NoteTakingSystem
