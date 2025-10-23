import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as d3 from 'd3'
import { 
  Network, 
  Search, 
  Filter, 
  Settings, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Play,
  Pause,
  Target,
  Brain,
  Zap,
  Activity,
  Eye,
  EyeOff,
  Layers,
  Sparkles
} from 'lucide-react'

interface KnowledgeNode {
  id: string
  label: string
  type: 'concept' | 'note' | 'task' | 'person' | 'project'
  x: number
  y: number
  size: number
  color: string
  connections: string[]
  strength: number
  tags: string[]
  createdAt: Date
  lastAccessed: Date
  relevance: number
}

interface KnowledgeGraphProps {
  className?: string
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ className = '' }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<KnowledgeNode[]>([])
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [isAnimating, setIsAnimating] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showLabels, setShowLabels] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [simulation, setSimulation] = useState<d3.Simulation<KnowledgeNode, undefined> | null>(null)

  // Generate knowledge graph data
  useEffect(() => {
    const generateKnowledgeGraph = () => {
      const newNodes: KnowledgeNode[] = []
      
      // Core concepts
      const coreConcepts = [
        { id: 'ai', label: 'Artificial Intelligence', type: 'concept' as const, tags: ['technology', 'future'] },
        { id: 'neural', label: 'Neural Networks', type: 'concept' as const, tags: ['ai', 'brain', 'learning'] },
        { id: 'brain', label: 'Second Brain', type: 'concept' as const, tags: ['productivity', 'knowledge'] },
        { id: 'interface', label: 'User Interface', type: 'concept' as const, tags: ['design', 'ux', 'interaction'] },
        { id: 'data', label: 'Data Visualization', type: 'concept' as const, tags: ['analytics', 'insights'] },
        { id: 'productivity', label: 'Productivity', type: 'concept' as const, tags: ['workflow', 'efficiency'] }
      ]

      // Notes
      const notes = [
        { id: 'note1', label: 'Neural Architecture Notes', type: 'note' as const, tags: ['architecture', 'design'] },
        { id: 'note2', label: 'AI Implementation Ideas', type: 'note' as const, tags: ['ai', 'implementation'] },
        { id: 'note3', label: 'User Experience Research', type: 'note' as const, tags: ['ux', 'research'] }
      ]

      // Tasks
      const tasks = [
        { id: 'task1', label: 'Design Wireframe Brain', type: 'task' as const, tags: ['design', 'wireframe'] },
        { id: 'task2', label: 'Implement Voice Commands', type: 'task' as const, tags: ['voice', 'ai'] },
        { id: 'task3', label: 'Optimize Performance', type: 'task' as const, tags: ['performance', 'optimization'] }
      ]

      // Projects
      const projects = [
        { id: 'project1', label: 'Second Brain App', type: 'project' as const, tags: ['app', 'development'] },
        { id: 'project2', label: 'AI Assistant', type: 'project' as const, tags: ['ai', 'assistant'] }
      ]

      // Combine all nodes
      const allNodes = [...coreConcepts, ...notes, ...tasks, ...projects]
      
      allNodes.forEach((node, index) => {
        const angle = (index / allNodes.length) * Math.PI * 2
        const radius = 0.3 + Math.random() * 0.4
        
        newNodes.push({
          ...node,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          size: 8 + Math.random() * 12,
          color: getNodeColor(node.type),
          connections: [],
          strength: Math.random(),
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          relevance: Math.random()
        })
      })

      // Create connections based on tags and relationships
      newNodes.forEach((node, i) => {
        const connections: string[] = []
        
        newNodes.forEach((otherNode, j) => {
          if (i !== j) {
            // Connect nodes with similar tags
            const commonTags = node.tags.filter(tag => otherNode.tags.includes(tag))
            if (commonTags.length > 0 && Math.random() > 0.7) {
              connections.push(otherNode.id)
            }
            
            // Connect related types
            if (
              (node.type === 'concept' && otherNode.type === 'note') ||
              (node.type === 'note' && otherNode.type === 'task') ||
              (node.type === 'task' && otherNode.type === 'project')
            ) {
              if (Math.random() > 0.8) {
                connections.push(otherNode.id)
              }
            }
          }
        })
        
        node.connections = connections
      })

      setNodes(newNodes)
    }

    generateKnowledgeGraph()
  }, [])

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'concept':
        return '#00D4FF'
      case 'note':
        return '#00BFFF'
      case 'task':
        return '#A855F7'
      case 'person':
        return '#10B981'
      case 'project':
        return '#F59E0B'
      default:
        return '#6B7280'
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'concept':
        return Brain
      case 'note':
        return Network
      case 'task':
        return Target
      case 'person':
        return Activity
      case 'project':
        return Layers
      default:
        return Network
    }
  }

  // D3 simulation setup
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current?.clientWidth || 800
    const height = containerRef.current?.clientHeight || 600

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)

    // Create force simulation
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<KnowledgeNode, any>()
        .id(d => d.id)
        .distance(100)
        .strength(0.1)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(20))

    setSimulation(sim)

    // Draw connections
    const links = g.selectAll('.link')
      .data(nodes.flatMap(node => 
        node.connections.map(targetId => ({
          source: node.id,
          target: targetId,
          strength: node.strength
        }))
      ))
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#00D4FF')
      .attr('stroke-width', d => 1 + d.strength * 3)
      .attr('opacity', 0.6)
      .style('filter', 'drop-shadow(0 0 2px #00D4FF)')

    // Draw nodes
    const nodeSelection = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d)
      })
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', 'scale(1.2)')
        
        // Highlight connected nodes
        g.selectAll('.node')
          .style('opacity', n => 
            n.id === d.id || d.connections.includes(n.id) ? 1 : 0.3
          )
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', 'scale(1)')
        
        // Reset opacity
        g.selectAll('.node')
          .style('opacity', 1)
      })

    // Add circles to nodes
    nodeSelection.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('opacity', d => 0.3 + d.relevance * 0.7)
      .style('filter', d => `drop-shadow(0 0 ${5 + d.relevance * 10}px ${d.color})`)

    // Add labels
    if (showLabels) {
      nodeSelection.append('text')
        .text(d => d.label)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', '#ffffff')
        .attr('font-size', '12px')
        .attr('font-family', 'Orbitron, monospace')
        .style('pointer-events', 'none')
    }

    // Update positions on simulation tick
    sim.on('tick', () => {
      links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      nodeSelection
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
    })

    return () => {
      sim.stop()
    }
  }, [nodes, showLabels])

  // Animation control
  useEffect(() => {
    if (simulation) {
      if (isAnimating) {
        simulation.alpha(0.3).restart()
      } else {
        simulation.stop()
      }
    }
  }, [isAnimating, simulation])

  const getFilteredNodes = () => {
    return nodes.filter(node => {
      const matchesSearch = !searchTerm || 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesType = filterType === 'all' || node.type === filterType
      
      return matchesSearch && matchesType
    })
  }

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? zoomLevel * 1.2 : zoomLevel / 1.2
    setZoomLevel(Math.max(0.1, Math.min(5, newZoom)))
    
    if (svgRef.current) {
      const g = d3.select(svgRef.current).select('g')
      g.transition().duration(200).attr('transform', `translate(${400}, ${300}) scale(${newZoom})`)
    }
  }

  const handleReset = () => {
    setZoomLevel(1)
    if (svgRef.current) {
      const g = d3.select(svgRef.current).select('g')
      g.transition().duration(200).attr('transform', 'translate(400, 300) scale(1)')
    }
  }

  const getTypeStats = () => {
    const stats = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return stats
  }

  const typeStats = getTypeStats()

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header Controls */}
      <div className="p-4 border-b border-neon-500/20 glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-orbitron text-neon-400 flex items-center">
            <Network className="w-5 h-5 mr-2" />
            Knowledge Graph
          </h2>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAnimating(!isAnimating)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isAnimating 
                  ? 'bg-neon-500 text-black shadow-neon-blue' 
                  : 'text-neon-400 border border-neon-500/30 hover:bg-neon-500/10'
              }`}
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLabels(!showLabels)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showLabels 
                  ? 'bg-neon-500 text-black shadow-neon-blue' 
                  : 'text-neon-400 border border-neon-500/30 hover:bg-neon-500/10'
              }`}
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-neon-400 border border-neon-500/30 hover:bg-neon-500/10 rounded-lg transition-all duration-200"
            >
              <Layers className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search knowledge graph..."
              className="wireframe-input w-full pl-10 pr-4 py-2 text-sm"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="wireframe-input text-sm"
          >
            <option value="all">All Types</option>
            <option value="concept">Concepts</option>
            <option value="note">Notes</option>
            <option value="task">Tasks</option>
            <option value="person">People</option>
            <option value="project">Projects</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="text-sm text-gray-300">
            <span className="text-neon-400 font-orbitron">{nodes.length}</span> nodes
          </div>
          <div className="text-sm text-gray-300">
            <span className="text-electric-400 font-orbitron">
              {nodes.reduce((acc, node) => acc + node.connections.length, 0)}
            </span> connections
          </div>
          <div className="text-sm text-gray-300">
            Zoom: <span className="text-holographic-400 font-orbitron">{Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="w-full h-full"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00D4FF" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleZoom('in')}
            className="p-2 bg-black/40 border border-neon-500/30 text-neon-400 rounded-lg hover:bg-neon-500/10 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleZoom('out')}
            className="p-2 bg-black/40 border border-neon-500/30 text-neon-400 rounded-lg hover:bg-neon-500/10 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="p-2 bg-black/40 border border-neon-500/30 text-neon-400 rounded-lg hover:bg-neon-500/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Type Legend */}
        <div className="absolute top-4 right-4 glass-panel p-3 rounded-lg">
          <h3 className="text-sm font-orbitron text-neon-400 mb-2">Node Types</h3>
          <div className="space-y-1">
            {Object.entries(typeStats).map(([type, count]) => (
              <div key={type} className="flex items-center space-x-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getNodeColor(type) }}
                />
                <span className="text-gray-300 capitalize">{type}</span>
                <span className="text-neon-400 font-orbitron">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Node Details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-4 bottom-4 glass-card p-4 rounded-lg border border-neon-500/30 shadow-neon-blue"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {React.createElement(getNodeIcon(selectedNode.type), { 
                  className: "w-5 h-5", 
                  style: { color: selectedNode.color } 
                })}
                <div>
                  <h3 className="text-lg font-orbitron text-white">{selectedNode.label}</h3>
                  <p className="text-sm text-gray-400 capitalize">{selectedNode.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-300">Connections: <span className="text-neon-400">{selectedNode.connections.length}</span></div>
                <div className="text-gray-300">Relevance: <span className="text-electric-400">{Math.round(selectedNode.relevance * 100)}%</span></div>
              </div>
              <div>
                <div className="text-gray-300">Created: <span className="text-holographic-400">{selectedNode.createdAt.toLocaleDateString()}</span></div>
                <div className="text-gray-300">Last Accessed: <span className="text-amber-400">{selectedNode.lastAccessed.toLocaleDateString()}</span></div>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="text-sm text-gray-300 mb-1">Tags:</div>
              <div className="flex flex-wrap gap-1">
                {selectedNode.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-neon-500/20 text-neon-400 text-xs rounded-full border border-neon-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default KnowledgeGraph
