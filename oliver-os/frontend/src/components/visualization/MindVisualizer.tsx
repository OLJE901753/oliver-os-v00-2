import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Network, Cpu, Zap, Settings } from 'lucide-react'
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

  // Generate nodes from thoughts
  const generateNodes = (): ThoughtNode[] => {
    const nodes: ThoughtNode[] = []
    
    thoughts.forEach((thought, index) => {
      // Main thought node
      nodes.push({
        id: thought.id,
        label: thought.content.substring(0, 30) + (thought.content.length > 30 ? '...' : ''),
        type: 'thought',
        size: Math.max(20, Math.min(60, thought.content.length / 2)),
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
            size: 15,
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
          Math.random() > 0.7 // 30% chance of connection
        )
        node.connections = relatedNodes.map(n => n.id)
      }
    })

    return nodes
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

    // Add hover effects
    node.on('mouseover', function(_event, d: any) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.size * 1.2)
        .attr('stroke-width', 3)
    })
    .on('mouseout', function(_event, d: any) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d.size)
        .attr('stroke-width', 2)
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
          <Eye className="w-12 h-12 text-thought-400 mx-auto" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Mind Visualizer
        </h1>
        <p className="text-brain-300">
          Explore your thoughts in interactive 2D and 3D visualizations
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Visualization */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Network className="w-6 h-6 mr-2 text-thought-400" />
                  Thought Network
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setVisualizationMode('2d')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      visualizationMode === '2d'
                        ? 'bg-thought-500 text-white'
                        : 'bg-brain-700 text-brain-300 hover:text-white'
                    }`}
                  >
                    2D Force
                  </button>
                  <button
                    onClick={() => setVisualizationMode('network')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      visualizationMode === 'network'
                        ? 'bg-thought-500 text-white'
                        : 'bg-brain-700 text-brain-300 hover:text-white'
                    }`}
                  >
                    Tree
                  </button>
                  <button
                    onClick={() => setVisualizationMode('3d')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      visualizationMode === '3d'
                        ? 'bg-thought-500 text-white'
                        : 'bg-brain-700 text-brain-300 hover:text-white'
                    }`}
                  >
                    3D (Coming Soon)
                  </button>
                </div>
              </div>

              {/* Visualization Container */}
              <div 
                ref={containerRef}
                className="w-full h-96 bg-brain-700/30 rounded-xl border border-brain-600/50 relative overflow-hidden"
              >
                <svg ref={svgRef} className="w-full h-full" />
                
                {/* Loading State */}
                {thoughts.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-brain-400">
                      <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
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
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-thought-400" />
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Total Thoughts</span>
                  <span className="text-white font-semibold">{thoughts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Connections</span>
                  <span className="text-white font-semibold">
                    {thoughts.reduce((acc, thought) => acc + (thought.insights?.length || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brain-300">Mode</span>
                  <span className="text-white font-semibold capitalize">{visualizationMode}</span>
                </div>
              </div>
            </div>

            {/* Animation Controls */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-thought-400" />
                Controls
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isAnimating
                      ? 'bg-yellow-500 text-white'
                      : 'bg-brain-700 text-brain-300 hover:text-white'
                  }`}
                >
                  {isAnimating ? 'Stop Animation' : 'Start Animation'}
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
                  className="w-full py-2 px-4 bg-thought-500 hover:bg-thought-600 text-white rounded-lg font-medium transition-colors"
                >
                  Refresh Layout
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-brain-800/50 backdrop-blur-sm rounded-2xl p-6 border border-brain-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-thought-400" />
                Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-brain-300 mb-2">Node Size</label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    defaultValue="20"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-brain-300 mb-2">Connection Strength</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
