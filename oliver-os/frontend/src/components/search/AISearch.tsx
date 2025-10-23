import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Mic, 
  MicOff, 
  Sparkles, 
  Brain, 
  Zap, 
  Clock, 
  Filter,
  SortAsc,
  SortDesc,
  Star,
  Bookmark,
  Share2,
  Copy,
  ExternalLink,
  Command,
  ArrowRight,
  Lightbulb,
  Target,
  Activity
} from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  content: string
  type: 'note' | 'task' | 'concept' | 'person' | 'project'
  relevance: number
  tags: string[]
  createdAt: Date
  lastAccessed: Date
  aiInsights: string[]
  confidence: number
  source: string
}

interface SearchSuggestion {
  id: string
  text: string
  type: 'recent' | 'suggestion' | 'ai-generated'
  confidence?: number
}

interface AISearchProps {
  className?: string
}

const AISearch: React.FC<AISearchProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'type'>('relevance')
  const [filterType, setFilterType] = useState<string>('all')
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Sample search results for demonstration
  const sampleResults: SearchResult[] = [
    {
      id: '1',
      title: 'Neural Network Architecture',
      content: 'Exploring the potential of creating a second brain interface that can process thoughts in real-time. The key is to establish strong neural pathways between different knowledge domains.',
      type: 'note',
      relevance: 0.95,
      tags: ['AI', 'Architecture', 'Neural Networks'],
      createdAt: new Date('2024-01-15'),
      lastAccessed: new Date('2024-01-15'),
      aiInsights: ['High potential for knowledge synthesis', 'Consider implementing graph-based connections'],
      confidence: 0.92,
      source: 'Notes'
    },
    {
      id: '2',
      title: 'Design wireframe brain interface',
      content: 'Create interactive 3D visualization of neural networks using D3.js and WebGL',
      type: 'task',
      relevance: 0.88,
      tags: ['UI/UX', 'D3.js', 'WebGL'],
      createdAt: new Date('2024-01-15'),
      lastAccessed: new Date('2024-01-15'),
      aiInsights: ['Consider using Three.js for better 3D performance', 'Add particle effects for neural activity'],
      confidence: 0.89,
      source: 'Tasks'
    },
    {
      id: '3',
      title: 'Artificial Intelligence',
      content: 'A branch of computer science that aims to create intelligent machines that can perform tasks that typically require human intelligence.',
      type: 'concept',
      relevance: 0.82,
      tags: ['technology', 'future', 'machine learning'],
      createdAt: new Date('2024-01-10'),
      lastAccessed: new Date('2024-01-14'),
      aiInsights: ['Core concept for understanding modern technology', 'Essential for building intelligent systems'],
      confidence: 0.95,
      source: 'Knowledge Graph'
    },
    {
      id: '4',
      title: 'Second Brain App',
      content: 'A comprehensive application for organizing thoughts, tasks, and knowledge in an interconnected way.',
      type: 'project',
      relevance: 0.79,
      tags: ['app', 'development', 'productivity'],
      createdAt: new Date('2024-01-08'),
      lastAccessed: new Date('2024-01-13'),
      aiInsights: ['Main project focus', 'Integrates multiple AI technologies'],
      confidence: 0.87,
      source: 'Projects'
    }
  ]

  // Generate AI suggestions based on search term
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([])
      return
    }

    const generateSuggestions = () => {
      const newSuggestions: SearchSuggestion[] = []
      
      // Recent searches
      const recentSearches = searchHistory
        .filter(term => term.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 3)
        .map(term => ({
          id: `recent-${term}`,
          text: term,
          type: 'recent' as const
        }))

      // AI-generated suggestions
      const aiSuggestions = [
        `${searchTerm} implementation`,
        `${searchTerm} best practices`,
        `${searchTerm} architecture`,
        `${searchTerm} optimization`,
        `${searchTerm} examples`
      ].slice(0, 3).map(suggestion => ({
        id: `ai-${suggestion}`,
        text: suggestion,
        type: 'ai-generated' as const,
        confidence: 0.8 + Math.random() * 0.2
      }))

      // Smart suggestions based on content
      const smartSuggestions = [
        'neural networks',
        'machine learning',
        'user interface',
        'data visualization',
        'productivity tools'
      ].filter(term => term.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 2)
        .map(term => ({
          id: `smart-${term}`,
          text: term,
          type: 'suggestion' as const,
          confidence: 0.7 + Math.random() * 0.3
        }))

      setSuggestions([...recentSearches, ...aiSuggestions, ...smartSuggestions])
    }

    const timeoutId = setTimeout(generateSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchHistory])

  const handleSearch = async (query: string = searchTerm) => {
    if (!query.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)
    
    // Add to search history
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(term => term !== query)]
      return newHistory.slice(0, 10)
    })

    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Filter results based on search term and filters
    const filteredResults = sampleResults.filter(result => {
      const matchesSearch = result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.content.toLowerCase().includes(query.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      
      const matchesType = filterType === 'all' || result.type === filterType
      
      return matchesSearch && matchesType
    })

    // Sort results
    const sortedResults = filteredResults.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevance - a.relevance
        case 'date':
          return b.lastAccessed.getTime() - a.lastAccessed.getTime()
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    setSearchResults(sortedResults)
    setIsSearching(false)

    // Generate AI insights
    setIsAIGenerating(true)
    setTimeout(() => {
      setAiInsights([
        `Found ${sortedResults.length} relevant results for "${query}"`,
        'Consider exploring related concepts in the knowledge graph',
        'Some results have high confidence scores indicating strong relevance'
      ])
      setIsAIGenerating(false)
    }, 1500)
  }

  const handleVoiceInput = () => {
    setIsListening(!isListening)
    // Voice input logic would go here
    // For now, simulate voice input
    if (!isListening) {
      setTimeout(() => {
        setSearchTerm('neural network architecture')
        handleSearch('neural network architecture')
        setIsListening(false)
      }, 2000)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.text)
    setShowSuggestions(false)
    handleSearch(suggestion.text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return Brain
      case 'task':
        return Target
      case 'concept':
        return Lightbulb
      case 'person':
        return Activity
      case 'project':
        return Zap
      default:
        return Search
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note':
        return 'text-neon-400'
      case 'task':
        return 'text-electric-400'
      case 'concept':
        return 'text-holographic-400'
      case 'person':
        return 'text-green-400'
      case 'project':
        return 'text-amber-400'
      default:
        return 'text-gray-400'
    }
  }

  const getSortedResults = () => {
    return [...searchResults].sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevance - a.relevance
        case 'date':
          return b.lastAccessed.getTime() - a.lastAccessed.getTime()
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Search Header */}
      <div className="p-4 border-b border-neon-500/20 glass-panel">
        <div className="flex items-center space-x-4 mb-4">
          <h2 className="text-lg font-orbitron text-neon-400 flex items-center">
            <Search className="w-5 h-5 mr-2" />
            AI Search
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Command className="w-4 h-4" />
            <span>Press Enter to search</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search your second brain..."
              className="wireframe-input w-full pl-12 pr-20 py-3 text-lg"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceInput}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isListening 
                    ? 'bg-neon-500 text-black shadow-neon-blue' 
                    : 'text-neon-400 hover:bg-neon-500/10'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSearch()}
                disabled={!searchTerm.trim() || isSearching}
                className="neon-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Search className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Search Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 glass-card rounded-lg border border-neon-500/30 shadow-neon-blue z-50"
              >
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 hover:bg-neon-500/10 transition-colors flex items-center space-x-3"
                  >
                    <div className="flex items-center space-x-2">
                      {suggestion.type === 'recent' && <Clock className="w-4 h-4 text-gray-400" />}
                      {suggestion.type === 'ai-generated' && <Sparkles className="w-4 h-4 text-holographic-400" />}
                      {suggestion.type === 'suggestion' && <Lightbulb className="w-4 h-4 text-electric-400" />}
                    </div>
                    <span className="text-white">{suggestion.text}</span>
                    {suggestion.confidence && (
                      <span className="text-xs text-neon-400 ml-auto">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center space-x-4 mt-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="wireframe-input text-sm"
          >
            <option value="all">All Types</option>
            <option value="note">Notes</option>
            <option value="task">Tasks</option>
            <option value="concept">Concepts</option>
            <option value="person">People</option>
            <option value="project">Projects</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="wireframe-input text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="type">Type</option>
          </select>
          
          <div className="text-sm text-gray-300">
            {searchResults.length} results
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-neon-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Brain className="w-6 h-6 text-neon-400" />
              </motion.div>
              <p className="text-neon-400 font-orbitron">Searching your knowledge...</p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="p-4 space-y-4">
            {/* AI Insights */}
            {aiInsights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-4 rounded-lg border border-holographic-500/30"
              >
                <h3 className="text-sm font-orbitron text-holographic-400 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Insights
                </h3>
                <div className="space-y-1">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="text-sm text-gray-300 flex items-start">
                      <Zap className="w-3 h-3 text-electric-400 mr-2 mt-0.5 flex-shrink-0" />
                      {insight}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results List */}
            {getSortedResults().map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedResult(result)}
                className="glass-card p-4 rounded-lg border border-neon-500/20 hover:border-neon-500/40 cursor-pointer transition-all duration-200 hover:shadow-neon-blue"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {React.createElement(getTypeIcon(result.type), { 
                      className: `w-5 h-5 ${getTypeColor(result.type)}` 
                    })}
                    <div>
                      <h3 className="text-lg font-medium text-white">{result.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span className="capitalize">{result.type}</span>
                        <span>•</span>
                        <span>{result.source}</span>
                        <span>•</span>
                        <span>{result.lastAccessed.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neon-400 font-orbitron">
                      {Math.round(result.relevance * 100)}%
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                  {result.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {result.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-neon-500/20 text-neon-400 text-xs rounded-full border border-neon-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No results found for "{searchTerm}"</p>
              <p className="text-sm text-gray-400 mt-2">Try different keywords or check your filters</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-16 h-16 bg-neon-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Brain className="w-8 h-8 text-neon-400" />
              </motion.div>
              <h3 className="text-xl font-orbitron text-neon-400 mb-2">Search Your Knowledge</h3>
              <p className="text-gray-300">Find notes, tasks, concepts, and more across your entire second brain</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Result Details */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-4 bottom-4 glass-card p-4 rounded-lg border border-neon-500/30 shadow-neon-blue"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {React.createElement(getTypeIcon(selectedResult.type), { 
                  className: `w-5 h-5 ${getTypeColor(selectedResult.type)}` 
                })}
                <div>
                  <h3 className="text-lg font-orbitron text-white">{selectedResult.title}</h3>
                  <p className="text-sm text-gray-400">{selectedResult.source}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-300 text-sm mb-3">{selectedResult.content}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {selectedResult.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-neon-500/20 text-neon-400 text-xs rounded-full border border-neon-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AISearch
