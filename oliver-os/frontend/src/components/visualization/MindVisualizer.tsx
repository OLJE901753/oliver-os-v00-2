import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  Network, 
  Cpu, 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Filter,
  Search,
  Layers,
  Target,
  Sparkles,
  Brain,
  Activity
} from 'lucide-react'
import { useThoughtStore } from '@/stores/thoughtStore'
import * as d3 from 'd3'

interface ThoughtNode {
  id: string
  label: string
  type: 'thought' | 'insight' | 'connection'
  x?: number
  y?: number
  size: number
  color: string
  connections: string[]
}

export const MindVisualizer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { thoughts } = useThoughtStore()
  const [visualizationMode, setVisualizationMode] = useState<'2d' | '3d' | 'network'>('2d')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<ThoughtNode | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [animationSpeed, setAnimationSpeed] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [nodeSize, setNodeSize] = useState(20)
  const [connectionStrength, setConnectionStrength] = useState(50)

  // Generate nodes from thoughts with filtering and search
  const generateNodes = (): ThoughtNode[] => {
    const nodes: ThoughtNode[] = []
    
    // Filter thoughts based on search and tags
    const filteredThoughts = thoughts.filter(thought => {
      const matchesSearch = !searchTerm || thought.content.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTags = filterTags.length === 0 || filterTags.some(tag => thought.tags?.includes(tag))
      return matchesSearch && matchesTags
    })
    
    filteredThoughts.forEach((thought, index) => {
      // Main thought node
      nodes.push({
        id: thought.id,
        label: thought.content.substring(0, 30) + (thought.content.length > 30 ? '...' : ''),
        type: 'thought',
        size: Math.max(nodeSize, Math.min(nodeSize * 3, thought.content.length / 2)),
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
        connections: [],
      })

      // Generate insights if available
      if (thought.insights) {
        thought.insights.forEach((insight, insightIndex) => {
          const insightId = `${thought.id}-insight-${insightIndex}`
          nodes.push({
            id: insightId,
            label: insight.substring(0, 20) + (insight.length > 20 ? '...' : ''),
            type: 'insight',
            size: nodeSize * 0.75,
            color: `hsl(${((index * 137.5) + (insightIndex * 60)) % 360}, 60%, 60%)`,
            connections: [thought.id],
          })
        })
      }
    })

    // Generate connections between related thoughts
    nodes.forEach((node, index) => {
      if (node.type === 'thought') {
        const relatedNodes = nodes.filter((otherNode, otherIndex) => 
          otherNode.type === 'thought' && 
          otherIndex !== index &&
          Math.random() > (1 - connectionStrength / 100) // Dynamic connection probability
        )
        node.connections = relatedNodes.map(n => n.id)
      }
    })

    return nodes
  }

  // Get all unique tags from thoughts
  const getAllTags = (): string[] => {
    const allTags = new Set<string>()
    thoughts.forEach(thought => {
      thought.tags?.forEach(tag => allTags.add(tag))
    })
    return Array.from(allTags)
  }

  // Create 2D D3 visualization
  const create2DVisualization = (nodes: ThoughtNode[]) => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Clear previous visualization
    svg.selectAll('*').remove()

    // Set up SVG
    svg.attr('width', width).attr('height', height)

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink().id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5))

    // Create links
    const links = nodes.flatMap(node => 
      node.connections.map(targetId => ({ source: node.id, target: targetId }))
    )

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)

    // Create nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    // Add circles for nodes
    node.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    // Add labels
    node.append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')

    // Add enhanced hover effects and interactions
    node.on('mouseover', function(_event, d: any) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.size * 1.3)
        .attr('stroke-width', 4)
        .attr('stroke', '#32CD32')
        .style('filter', 'drop-shadow(0 0 10px rgba(50, 205, 50, 0.8))')
      
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .style('font-size', '14px')
        .style('font-weight', 'bold')
      
      // Highlight connected nodes
      const connectedNodes = nodes.filter(n => d.connections.includes(n.id))
      connectedNodes.forEach(connectedNode => {
        const connectedElement = node.filter((n: any) => n.id === connectedNode.id)
        connectedElement.select('circle')
          .transition()
          .duration(200)
          .attr('stroke', '#00FFFF')
          .attr('stroke-width', 3)
      })
    })
    .on('mouseout', function(_event, d: any) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.size)
        .attr('stroke-width', 2)
        .attr('stroke', '#fff')
        .style('filter', 'none')
      
      d3.select(this).select('text')
        .transition()
        .duration(200)
        .style('font-size', '12px')
        .style('font-weight', 'normal')
      
      // Reset connected nodes
      const connectedNodes = nodes.filter(n => d.connections.includes(n.id))
      connectedNodes.forEach(connectedNode => {
        const connectedElement = node.filter((n: any) => n.id === connectedNode.id)
        connectedElement.select('circle')
          .transition()
          .duration(200)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
      })
    })
    .on('click', function(_event, d: any) {
      setSelectedNode(d)
    })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
  }

  // Create network visualization
  const createNetworkVisualization = (nodes: ThoughtNode[]) => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    // Create a hierarchical layout
    const root = d3.hierarchy({ children: nodes } as any)
    const tree = d3.tree().size([height - 100, width - 100])
    tree(root)

    const g = svg.append('g')
      .attr('transform', `translate(50, 50)`)

    // Add links
    g.selectAll('.link')
      .data(root.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', (d: any) => {
        const link = d3.linkVertical().x((d: any) => d.x).y((d: any) => d.y)
        return link(d)
      })
      .attr('fill', 'none')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)

    // Add nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)

    node.append('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => d.data.color || '#64748b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    node.append('text')
      .attr('dy', '0.35em')
      .attr('x', (d: any) => d.children ? -25 : 25)
      .attr('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .text((d: any) => d.data.label || '')
      .attr('fill', '#fff')
      .attr('font-size', '12px')
  }

  // Update visualization when thoughts change
  useEffect(() => {
    const nodes = generateNodes()
    
    if (visualizationMode === '2d') {
      create2DVisualization(nodes)
    } else if (visualizationMode === 'network') {
      createNetworkVisualization(nodes)
    }
  }, [thoughts, visualizationMode])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const nodes = generateNodes()
      if (visualizationMode === '2d') {
        create2DVisualization(nodes)
      } else if (visualizationMode === 'network') {
        createNetworkVisualization(nodes)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [visualizationMode, thoughts])

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Holographic Background Effect */}
      <div className="absolute inset-0 holographic-bg opacity-10"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 particle-field">
        {[...Array(18)].map((_, i) => (
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
            <Eye className="w-12 h-12 text-lime-400 mx-auto" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-lime-400/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>
        <h1 className="text-4xl font-bold gradient-text mb-2 neon-text">
          Mind Visualizer
        </h1>
        <p className="text-gray-300">
          Explore your thoughts in interactive 2D and 3D visualizations
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Visualization */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-lime-400 flex items-center neon-text">
                  <Network className="w-7 h-7 mr-3" />
                  Thought Network
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setVisualizationMode('2d')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      visualizationMode === '2d'
                        ? 'bg-lime-500 text-white border border-lime-400 shadow-neon-lime'
                        : 'bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30'
                    }`}
                  >
                    2D Force
                  </button>
                  <button
                    onClick={() => setVisualizationMode('network')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      visualizationMode === 'network'
                        ? 'bg-lime-500 text-white border border-lime-400 shadow-neon-lime'
                        : 'bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30'
                    }`}
                  >
                    Tree
                  </button>
                  <button
                    onClick={() => setVisualizationMode('3d')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      visualizationMode === '3d'
                        ? 'bg-lime-500 text-white border border-lime-400 shadow-neon-lime'
                        : 'bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30'
                    }`}
                  >
                    3D (Coming Soon)
                  </button>
                </div>
              </div>

              {/* Visualization Container */}
              <div 
                ref={containerRef}
                className="w-full h-96 glass-panel rounded-xl border border-lime-500/20 relative overflow-hidden"
              >
                <svg ref={svgRef} className="w-full h-full" />
                
                {/* Loading State */}
                {thoughts.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="relative mb-4">
                        <Network className="w-16 h-16 mx-auto opacity-50" />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-lime-400/20 rounded-full blur-xl"
                        />
                      </div>
                      <p className="text-lg font-medium">No thoughts to visualize</p>
                      <p className="text-sm">Add some thoughts to see the network</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Visualization Stats */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Cpu className="w-5 h-5 mr-2" />
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Thoughts</span>
                  <span className="text-white font-semibold">{thoughts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Connections</span>
                  <span className="text-white font-semibold">
                    {thoughts.reduce((acc, thought) => acc + (thought.insights?.length || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Mode</span>
                  <span className="text-white font-semibold capitalize">{visualizationMode}</span>
                </div>
              </div>
            </div>

            {/* Enhanced Controls */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Zap className="w-5 h-5 mr-2" />
                Controls
              </h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsAnimating(!isAnimating)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                      isAnimating
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-neon-amber'
                        : 'bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30'
                    }`}
                  >
                    {isAnimating ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                    {isAnimating ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={() => {
                      const nodes = generateNodes()
                      if (visualizationMode === '2d') {
                        create2DVisualization(nodes)
                      } else if (visualizationMode === 'network') {
                        createNetworkVisualization(nodes)
                      }
                    }}
                    className="flex-1 py-2 px-3 neon-button text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </button>
                </div>
                
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center bg-gray-500/20 text-gray-300 hover:bg-lime-500/20 hover:text-lime-300 border border-gray-500/30 hover:border-lime-500/30"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Search className="w-5 h-5 mr-2" />
                Search & Filter
              </h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search thoughts..."
                    className="futuristic-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-lime-300 mb-2">Filter by Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {getAllTags().slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setFilterTags(prev => 
                            prev.includes(tag) 
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          )
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
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
              </div>
            </div>

            {/* Enhanced Settings */}
            <div className="glass-card p-6 border border-lime-500/20 shadow-neon-lime">
              <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-lime-300 mb-2 flex items-center">
                    <div className="w-1 h-1 bg-lime-400 rounded-full mr-2 animate-neon-pulse"></div>
                    Node Size: {nodeSize}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={nodeSize}
                    onChange={(e) => setNodeSize(Number(e.target.value))}
                    className="w-full futuristic-input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-lime-300 mb-2 flex items-center">
                    <div className="w-1 h-1 bg-lime-400 rounded-full mr-2 animate-neon-pulse"></div>
                    Connection Strength: {connectionStrength}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={connectionStrength}
                    onChange={(e) => setConnectionStrength(Number(e.target.value))}
                    className="w-full futuristic-input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-lime-300 mb-2 flex items-center">
                    <div className="w-1 h-1 bg-lime-400 rounded-full mr-2 animate-neon-pulse"></div>
                    Animation Speed: {animationSpeed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                    className="w-full futuristic-input"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showLabels"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="w-4 h-4 text-lime-400 bg-gray-700 border-gray-600 rounded focus:ring-lime-500 focus:ring-2"
                  />
                  <label htmlFor="showLabels" className="text-sm text-lime-300">
                    Show Labels
                  </label>
                </div>
              </div>
            </div>

            {/* Node Details Panel */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card p-6 border border-lime-500/20 shadow-neon-lime"
                >
                  <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center neon-text">
                    <Target className="w-5 h-5 mr-2" />
                    Node Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-lime-300 mb-1">Type</label>
                      <span className="text-white font-medium capitalize">{selectedNode.type}</span>
                    </div>
                    <div>
                      <label className="block text-sm text-lime-300 mb-1">Label</label>
                      <span className="text-white font-medium">{selectedNode.label}</span>
                    </div>
                    <div>
                      <label className="block text-sm text-lime-300 mb-1">Size</label>
                      <span className="text-white font-medium">{selectedNode.size}</span>
                    </div>
                    <div>
                      <label className="block text-sm text-lime-300 mb-1">Connections</label>
                      <span className="text-white font-medium">{selectedNode.connections.length}</span>
                    </div>
                    <div>
                      <label className="block text-sm text-lime-300 mb-1">Color</label>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-400"
                          style={{ backgroundColor: selectedNode.color }}
                        />
                        <span className="text-white font-medium text-xs">{selectedNode.color}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gray-500/20 text-gray-300 hover:bg-red-500/20 hover:text-red-300 border border-gray-500/30 hover:border-red-500/30"
                    >
                      Close Details
                    </button>
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
