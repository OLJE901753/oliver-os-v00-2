import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'

interface BrainNode {
  id: string
  x: number
  y: number
  z: number
  type: 'neuron' | 'synapse' | 'connection'
  size: number
  color: string
  connections: string[]
  activity: number
}

interface WireframeBrainProps {
  width?: number
  height?: number
  className?: string
  onNodeClick?: (node: BrainNode) => void
  selectedNode?: BrainNode | null
}

const WireframeBrain: React.FC<WireframeBrainProps> = ({
  width = 400,
  height = 400,
  className = '',
  onNodeClick,
  selectedNode
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<BrainNode[]>([])
  const [connections, setConnections] = useState<Array<{ source: BrainNode; target: BrainNode }>>([])
  const [isAnimating, setIsAnimating] = useState(true)

  // Generate brain structure
  useEffect(() => {
    const generateBrainStructure = () => {
      const newNodes: BrainNode[] = []
      const newConnections: Array<{ source: BrainNode; target: BrainNode }> = []

      // Create brain outline nodes (cerebrum)
      const cerebrumNodes = 20
      for (let i = 0; i < cerebrumNodes; i++) {
        const angle = (i / cerebrumNodes) * Math.PI * 2
        const radius = 0.4
        newNodes.push({
          id: `cerebrum-${i}`,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0,
          type: 'neuron',
          size: 3 + Math.random() * 2,
          color: '#00D4FF',
          connections: [],
          activity: Math.random()
        })
      }

      // Create cerebellum nodes
      const cerebellumNodes = 12
      for (let i = 0; i < cerebellumNodes; i++) {
        const angle = (i / cerebellumNodes) * Math.PI * 2
        const radius = 0.25
        newNodes.push({
          id: `cerebellum-${i}`,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius - 0.3,
          z: 0,
          type: 'neuron',
          size: 2 + Math.random() * 1.5,
          color: '#00BFFF',
          connections: [],
          activity: Math.random()
        })
      }

      // Create internal neural network nodes
      const internalNodes = 30
      for (let i = 0; i < internalNodes; i++) {
        newNodes.push({
          id: `internal-${i}`,
          x: (Math.random() - 0.5) * 0.6,
          y: (Math.random() - 0.5) * 0.6,
          z: (Math.random() - 0.5) * 0.3,
          type: 'synapse',
          size: 1 + Math.random() * 1.5,
          color: '#A855F7',
          connections: [],
          activity: Math.random()
        })
      }

      // Create connections
      newNodes.forEach((node, i) => {
        const numConnections = Math.floor(Math.random() * 4) + 1
        for (let j = 0; j < numConnections; j++) {
          const targetIndex = Math.floor(Math.random() * newNodes.length)
          if (targetIndex !== i) {
            const target = newNodes[targetIndex]
            node.connections.push(target.id)
            newConnections.push({ source: node, target })
          }
        }
      })

      setNodes(newNodes)
      setConnections(newConnections)
    }

    generateBrainStructure()
  }, [])

  // Animate neural activity
  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          activity: Math.random(),
          color: node.activity > 0.7 ? '#00D4FF' : node.activity > 0.4 ? '#00BFFF' : '#A855F7'
        }))
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [isAnimating])

  // Render brain with D3
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)

    // Create projection for 3D effect
    const projection = d3.geoOrthographic()
      .scale(width * 0.3)
      .translate([0, 0])

    // Draw connections
    g.selectAll('.connection')
      .data(connections)
      .enter()
      .append('line')
      .attr('class', 'connection')
      .attr('x1', d => d.source.x * width * 0.3)
      .attr('y1', d => d.source.y * width * 0.3)
      .attr('x2', d => d.target.x * width * 0.3)
      .attr('y2', d => d.target.y * width * 0.3)
      .attr('stroke', '#00D4FF')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6)
      .style('filter', 'drop-shadow(0 0 2px #00D4FF)')

    // Draw nodes
    const nodeSelection = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('cx', d => d.x * width * 0.3)
      .attr('cy', d => d.y * width * 0.3)
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('opacity', d => 0.3 + d.activity * 0.7)
      .style('filter', d => `drop-shadow(0 0 ${3 + d.activity * 5}px ${d.color})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        onNodeClick?.(d)
      })
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size * 1.5)
          .attr('opacity', 1)
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.size)
          .attr('opacity', 0.3 + d.activity * 0.7)
      })

    // Add pulsing animation to active nodes
    nodeSelection
      .filter(d => d.activity > 0.7)
      .transition()
      .duration(1000)
      .attr('r', d => d.size * 1.2)
      .transition()
      .duration(1000)
      .attr('r', d => d.size)

  }, [nodes, connections, width, height, onNodeClick])

  return (
    <div className={`relative ${className}`}>
      {/* Brain Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          animate={{ rotateY: isAnimating ? 360 : 0 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="w-full h-full"
          >
            {/* Background glow effect */}
            <defs>
              <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle
              cx={width / 2}
              cy={height / 2}
              r={width * 0.4}
              fill="url(#brainGlow)"
            />
          </svg>
        </motion.div>

        {/* Overlay Information */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 glass-panel p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-neon-400 rounded-full animate-neon-pulse"></div>
              <span className="text-neon-400 font-orbitron">Neural Activity</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {nodes.filter(n => n.activity > 0.7).length} active nodes
            </div>
          </div>

          <div className="absolute top-4 right-4 glass-panel p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-electric-400 rounded-full"></div>
              <span className="text-electric-400 font-orbitron">Connections</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {connections.length} pathways
            </div>
          </div>

          <div className="absolute bottom-4 left-4 glass-panel p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-holographic-400 rounded-full"></div>
              <span className="text-holographic-400 font-orbitron">Synapses</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {nodes.filter(n => n.type === 'synapse').length} active
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="absolute bottom-4 right-4 glass-panel p-3 rounded-lg">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAnimating(!isAnimating)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isAnimating 
                ? 'bg-neon-500 text-black shadow-neon-blue' 
                : 'text-neon-400 border border-neon-500/30 hover:bg-neon-500/10'
            }`}
          >
            {isAnimating ? 'Pause' : 'Play'}
          </motion.button>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glass-card p-4 rounded-lg border border-neon-500/30 shadow-neon-blue"
        >
          <h3 className="text-neon-400 font-orbitron text-sm mb-2">
            {selectedNode.type === 'neuron' ? 'Neuron' : selectedNode.type === 'synapse' ? 'Synapse' : 'Connection'}
          </h3>
          <div className="text-xs text-gray-300 space-y-1">
            <div>Activity: {Math.round(selectedNode.activity * 100)}%</div>
            <div>Connections: {selectedNode.connections.length}</div>
            <div>Size: {selectedNode.size.toFixed(1)}</div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default WireframeBrain
