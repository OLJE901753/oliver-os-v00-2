import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Clock, 
  Flag, 
  Calendar,
  Filter,
  Search,
  Zap,
  Brain,
  Target,
  Activity,
  Archive,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in-progress' | 'completed' | 'archived'
  dueDate?: Date
  tags: string[]
  createdAt: Date
  updatedAt: Date
  estimatedTime?: number // in minutes
  actualTime?: number // in minutes
  aiSuggestions: string[]
  confidence: number
}

interface TaskManagerProps {
  className?: string
}

const TaskManager: React.FC<TaskManagerProps> = ({ className = '' }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'title'>('dueDate')
  const [showArchived, setShowArchived] = useState(false)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    estimatedTime: 0
  })

  // Sample tasks for demonstration
  useEffect(() => {
    const sampleTasks: Task[] = [
      {
        id: '1',
        title: 'Design wireframe brain interface',
        description: 'Create interactive 3D visualization of neural networks using D3.js and WebGL',
        priority: 'high',
        status: 'in-progress',
        dueDate: new Date('2024-01-20'),
        tags: ['UI/UX', 'D3.js', 'WebGL'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        estimatedTime: 240,
        actualTime: 120,
        aiSuggestions: ['Consider using Three.js for better 3D performance', 'Add particle effects for neural activity'],
        confidence: 0.89
      },
      {
        id: '2',
        title: 'Implement voice commands',
        description: 'Add speech recognition for hands-free task management',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date('2024-01-25'),
        tags: ['Voice', 'AI', 'Accessibility'],
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14'),
        estimatedTime: 180,
        aiSuggestions: ['Use Web Speech API for browser compatibility', 'Add voice feedback for confirmation'],
        confidence: 0.76
      },
      {
        id: '3',
        title: 'Optimize performance',
        description: 'Improve rendering performance for large datasets',
        priority: 'urgent',
        status: 'todo',
        dueDate: new Date('2024-01-18'),
        tags: ['Performance', 'Optimization'],
        createdAt: new Date('2024-01-13'),
        updatedAt: new Date('2024-01-13'),
        estimatedTime: 300,
        aiSuggestions: ['Implement virtual scrolling', 'Use Web Workers for heavy computations'],
        confidence: 0.92
      },
      {
        id: '4',
        title: 'Write documentation',
        description: 'Create comprehensive API documentation and user guide',
        priority: 'low',
        status: 'completed',
        dueDate: new Date('2024-01-10'),
        tags: ['Documentation', 'API'],
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-12'),
        estimatedTime: 120,
        actualTime: 150,
        aiSuggestions: ['Include interactive examples', 'Add code snippets for common use cases'],
        confidence: 0.85
      }
    ]
    setTasks(sampleTasks)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 border-red-500/30 bg-red-500/10'
      case 'high':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10'
      case 'medium':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
      case 'low':
        return 'text-green-400 border-green-500/30 bg-green-500/10'
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-500/10'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 border-green-500/30 bg-green-500/10'
      case 'in-progress':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10'
      case 'todo':
        return 'text-gray-400 border-gray-500/30 bg-gray-500/10'
      case 'archived':
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10'
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-500/10'
    }
  }

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      const matchesArchive = showArchived ? task.status === 'archived' : task.status !== 'archived'
      
      return matchesSearch && matchesStatus && matchesPriority && matchesArchive
    }).sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate.getTime() - b.dueDate.getTime()
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
  }

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'todo',
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedTime: newTask.estimatedTime,
      aiSuggestions: [],
      confidence: 0.5
    }

    setTasks(prev => [task, ...prev])
    setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', estimatedTime: 0 })
    setIsCreating(false)
    setIsAIGenerating(true)

    // Simulate AI processing
    setTimeout(() => {
      const updatedTask = {
        ...task,
        aiSuggestions: [
          'Consider breaking this into smaller subtasks',
          'Set a realistic deadline based on complexity',
          'Add relevant tags for better organization'
        ],
        confidence: 0.82
      }
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t))
      setIsAIGenerating(false)
    }, 2000)
  }

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
    ))
  }

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
    if (selectedTask?.id === id) {
      setSelectedTask(null)
    }
  }

  const handleToggleStatus = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const statusOrder = ['todo', 'in-progress', 'completed']
    const currentIndex = statusOrder.indexOf(task.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length] as Task['status']
    
    handleUpdateTask(id, { status: nextStatus })
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length
    
    return { total, completed, inProgress, overdue }
  }

  const stats = getTaskStats()

  return (
    <div className={`h-full flex ${className}`}>
      {/* Tasks List Sidebar */}
      <div className="w-1/3 border-r border-neon-500/20 glass-panel">
        <div className="p-4 border-b border-neon-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-orbitron text-neon-400 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2" />
              Tasks
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreating(true)}
              className="p-2 text-neon-400 hover:bg-neon-500/10 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="glass-panel p-2 rounded-lg text-center">
              <div className="text-lg font-orbitron text-neon-400">{stats.total}</div>
              <div className="text-xs text-gray-300">Total</div>
            </div>
            <div className="glass-panel p-2 rounded-lg text-center">
              <div className="text-lg font-orbitron text-green-400">{stats.completed}</div>
              <div className="text-xs text-gray-300">Done</div>
            </div>
            <div className="glass-panel p-2 rounded-lg text-center">
              <div className="text-lg font-orbitron text-blue-400">{stats.inProgress}</div>
              <div className="text-xs text-gray-300">Active</div>
            </div>
            <div className="glass-panel p-2 rounded-lg text-center">
              <div className="text-lg font-orbitron text-red-400">{stats.overdue}</div>
              <div className="text-xs text-gray-300">Overdue</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="wireframe-input w-full pl-10 pr-4 py-2 text-sm"
              />
            </div>

            <div className="flex space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="wireframe-input text-sm flex-1"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="wireframe-input text-sm flex-1"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
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
                className="wireframe-input text-sm flex-1"
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="created">Created</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto">
          {getFilteredTasks().map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedTask(task)}
              className={`p-4 border-b border-neon-500/10 cursor-pointer transition-all duration-200 ${
                selectedTask?.id === task.id 
                  ? 'bg-neon-500/10 border-neon-500/30' 
                  : 'hover:bg-neon-500/5'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-white text-sm line-clamp-1 flex-1">
                  {task.title}
                </h3>
                <div className="flex items-center space-x-1 ml-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-300 line-clamp-2 mb-2">
                {task.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {task.dueDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-neon-400">
                    {Math.round(task.confidence * 100)}%
                  </span>
                  {task.estimatedTime && (
                    <span className="text-xs text-gray-400">
                      {task.estimatedTime}m
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedTask ? (
          /* Task Details */
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-neon-500/20 glass-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-orbitron text-neon-400">
                    {isEditing ? 'Edit Task' : 'Task Details'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateTask(selectedTask.id, { isStarred: !selectedTask.isStarred })}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        selectedTask.isStarred 
                          ? 'text-amber-400' 
                          : 'text-gray-400 hover:text-amber-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${selectedTask.isStarred ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 text-neon-400 hover:bg-neon-500/10 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleStatus(selectedTask.id)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      selectedTask.status === 'completed'
                        ? 'bg-green-500 text-black'
                        : selectedTask.status === 'in-progress'
                        ? 'bg-blue-500 text-black'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {selectedTask.status === 'completed' ? (
                      <>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Completed
                      </>
                    ) : selectedTask.status === 'in-progress' ? (
                      <>
                        <Activity className="w-4 h-4 mr-2" />
                        In Progress
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Task
                      </>
                    )}
                  </motion.button>
                  
                  <button
                    onClick={() => handleUpdateTask(selectedTask.id, { status: 'archived' })}
                    className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => handleUpdateTask(selectedTask.id, { title: e.target.value })}
                    className="wireframe-input w-full"
                    placeholder="Task title..."
                  />
                  <textarea
                    value={selectedTask.description}
                    onChange={(e) => handleUpdateTask(selectedTask.id, { description: e.target.value })}
                    className="wireframe-input w-full h-32 resize-none"
                    placeholder="Task description..."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={selectedTask.priority}
                      onChange={(e) => handleUpdateTask(selectedTask.id, { priority: e.target.value as any })}
                      className="wireframe-input"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={selectedTask.dueDate ? selectedTask.dueDate.toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleUpdateTask(selectedTask.id, { dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                      className="wireframe-input"
                    />
                  </div>
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
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-orbitron text-white">
                      {selectedTask.title}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-sm border ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed">
                      {selectedTask.description}
                    </p>
                  </div>

                  {/* Task Metadata */}
                  <div className="grid grid-cols-2 gap-4 glass-panel p-4 rounded-lg">
                    <div>
                      <h3 className="text-sm font-orbitron text-neon-400 mb-2">Timeline</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        <div>Created: {selectedTask.createdAt.toLocaleDateString()}</div>
                        <div>Updated: {selectedTask.updatedAt.toLocaleDateString()}</div>
                        {selectedTask.dueDate && (
                          <div>Due: {selectedTask.dueDate.toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-orbitron text-neon-400 mb-2">Time Tracking</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        {selectedTask.estimatedTime && (
                          <div>Estimated: {selectedTask.estimatedTime}m</div>
                        )}
                        {selectedTask.actualTime && (
                          <div>Actual: {selectedTask.actualTime}m</div>
                        )}
                        <div>Confidence: {Math.round(selectedTask.confidence * 100)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Suggestions */}
                  {selectedTask.aiSuggestions.length > 0 && (
                    <div className="glass-panel p-4 rounded-lg">
                      <h3 className="text-sm font-orbitron text-holographic-400 mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        AI Suggestions
                      </h3>
                      <div className="space-y-2">
                        {selectedTask.aiSuggestions.map((suggestion, index) => (
                          <div key={index} className="text-sm text-gray-300 flex items-start">
                            <Zap className="w-3 h-3 text-electric-400 mr-2 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.tags.map(tag => (
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
          /* New Task Creation */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full glass-card p-8 rounded-xl">
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <div className="w-16 h-16 bg-neon-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckSquare className="w-8 h-8 text-neon-400" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-orbitron text-neon-400 mb-2">
                  Create New Task
                </h2>
                <p className="text-gray-300">
                  Organize your work with intelligent task management
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title..."
                  className="wireframe-input w-full"
                />
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description..."
                  className="wireframe-input w-full h-32 resize-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="wireframe-input"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="wireframe-input"
                  />
                </div>
                <input
                  type="number"
                  value={newTask.estimatedTime}
                  onChange={(e) => setNewTask(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 0 }))}
                  placeholder="Estimated time (minutes)"
                  className="wireframe-input w-full"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim() || isAIGenerating}
                  className="neon-button px-6 py-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Create Task
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskManager
