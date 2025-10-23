import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as d3 from 'd3'
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Brain, 
  Zap, 
  Target,
  Clock,
  Users,
  FileText,
  CheckSquare,
  Network,
  Search,
  Settings,
  RefreshCw,
  Download,
  Share2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react'

interface ChartData {
  id: string
  label: string
  value: number
  color: string
  trend?: number
}

interface DashboardMetric {
  id: string
  title: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
}

interface DataDashboardProps {
  className?: string
}

const DataDashboard: React.FC<DataDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  
  const chartRef = useRef<HTMLDivElement>(null)
  const lineChartRef = useRef<SVGSVGElement>(null)

  // Generate sample data
  useEffect(() => {
    const generateData = () => {
      // Generate metrics
      const newMetrics: DashboardMetric[] = [
        {
          id: 'thoughts',
          title: 'Thoughts Captured',
          value: 1247,
          change: 12.5,
          trend: 'up',
          icon: Brain,
          color: '#00D4FF'
        },
        {
          id: 'tasks',
          title: 'Tasks Completed',
          value: 89,
          change: 8.2,
          trend: 'up',
          icon: CheckSquare,
          color: '#00BFFF'
        },
        {
          id: 'connections',
          title: 'Knowledge Connections',
          value: 342,
          change: 15.3,
          trend: 'up',
          icon: Network,
          color: '#A855F7'
        },
        {
          id: 'searches',
          title: 'AI Searches',
          value: 156,
          change: -2.1,
          trend: 'down',
          icon: Search,
          color: '#10B981'
        },
        {
          id: 'efficiency',
          title: 'Productivity Score',
          value: 87,
          change: 5.7,
          trend: 'up',
          icon: Target,
          color: '#F59E0B'
        },
        {
          id: 'ai_insights',
          title: 'AI Insights Generated',
          value: 234,
          change: 22.1,
          trend: 'up',
          icon: Zap,
          color: '#EF4444'
        }
      ]

      // Generate chart data
      const newChartData: ChartData[] = [
        { id: 'notes', label: 'Notes', value: 45, color: '#00D4FF', trend: 12 },
        { id: 'tasks', label: 'Tasks', value: 32, color: '#00BFFF', trend: 8 },
        { id: 'concepts', label: 'Concepts', value: 28, color: '#A855F7', trend: 15 },
        { id: 'projects', label: 'Projects', value: 18, color: '#10B981', trend: 5 },
        { id: 'people', label: 'People', value: 12, color: '#F59E0B', trend: 3 }
      ]

      setMetrics(newMetrics)
      setChartData(newChartData)
      setIsLoading(false)
    }

    generateData()
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setLastUpdated(new Date())
      // Simulate data updates
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + Math.floor(Math.random() * 3),
        change: metric.change + (Math.random() - 0.5) * 2
      })))
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Render donut chart
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return

    const container = chartRef.current
    container.innerHTML = ''

    const width = 300
    const height = 300
    const radius = Math.min(width, height) / 2

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`)

    const pie = d3.pie<ChartData>()
      .value(d => d.value)
      .sort(null)

    const arc = d3.arc<d3.PieArcDatum<ChartData>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.8)

    const arcs = g.selectAll('.arc')
      .data(pie(chartData))
      .enter()
      .append('g')
      .attr('class', 'arc')

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('opacity', 0.8)
      .style('filter', 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.3))')

    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-family', 'Orbitron, monospace')
      .text(d => d.data.value)

    // Add center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#00D4FF')
      .attr('font-size', '16px')
      .attr('font-family', 'Orbitron, monospace')
      .attr('font-weight', 'bold')
      .text('Total')

  }, [chartData])

  // Render line chart
  useEffect(() => {
    if (!lineChartRef.current) return

    const svg = d3.select(lineChartRef.current)
    svg.selectAll('*').remove()

    const width = 400
    const height = 200
    const margin = { top: 20, right: 30, bottom: 30, left: 40 }

    // Generate sample time series data
    const data = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      value: 50 + Math.random() * 50 + Math.sin(i * 0.2) * 20
    }))

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([margin.left, width - margin.right])

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 100])
      .range([height - margin.bottom, margin.top])

    const line = d3.line<{ date: Date; value: number }>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    svg.attr('width', width)
      .attr('height', height)

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x)
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat(() => '')
      )
      .style('stroke', '#00D4FF')
      .style('opacity', 0.1)

    // Add line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#00D4FF')
      .attr('stroke-width', 2)
      .attr('d', line)
      .style('filter', 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.5))')

    // Add dots
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 3)
      .attr('fill', '#00D4FF')
      .style('filter', 'drop-shadow(0 0 2px rgba(0, 212, 255, 0.8))')

  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Dashboard Header */}
      <div className="p-4 border-b border-neon-500/20 glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-orbitron text-neon-400 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Data Dashboard
          </h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="wireframe-input text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                autoRefresh 
                  ? 'bg-neon-500 text-black shadow-neon-blue' 
                  : 'text-neon-400 border border-neon-500/30 hover:bg-neon-500/10'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-neon-400 border border-neon-500/30 hover:bg-neon-500/10 rounded-lg transition-all duration-200"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-300">
          <div>Last updated: {lastUpdated.toLocaleTimeString()}</div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 hover:text-neon-400 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-neon-400 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-neon-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <BarChart3 className="w-6 h-6 text-neon-400" />
              </motion.div>
              <p className="text-neon-400 font-orbitron">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-4 rounded-lg border border-neon-500/20 hover:border-neon-500/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${metric.color}20` }}
                      >
                        <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-300">{metric.title}</h3>
                        <div className="text-2xl font-orbitron text-white">{metric.value.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <div className="glass-card p-6 rounded-lg border border-neon-500/20">
                <h3 className="text-lg font-orbitron text-neon-400 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Content Distribution
                </h3>
                <div className="flex items-center justify-center">
                  <div ref={chartRef} className="w-80 h-80"></div>
                </div>
                <div className="mt-4 space-y-2">
                  {chartData.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-300">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-orbitron">{item.value}</span>
                        <span className="text-green-400 text-xs">+{item.trend}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Chart */}
              <div className="glass-card p-6 rounded-lg border border-neon-500/20">
                <h3 className="text-lg font-orbitron text-neon-400 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Activity Trend
                </h3>
                <div className="flex items-center justify-center">
                  <svg ref={lineChartRef} className="w-full h-48"></svg>
                </div>
                <div className="mt-4 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Average daily activity</span>
                    <span className="text-neon-400 font-orbitron">75.2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Peak activity</span>
                    <span className="text-electric-400 font-orbitron">98.7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-card p-4 rounded-lg border border-neon-500/20">
                <h3 className="text-sm font-orbitron text-neon-400 mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Insights
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-start">
                    <Zap className="w-3 h-3 text-electric-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Your productivity has increased by 15% this week</span>
                  </div>
                  <div className="flex items-start">
                    <Zap className="w-3 h-3 text-electric-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Consider organizing related concepts together</span>
                  </div>
                  <div className="flex items-start">
                    <Zap className="w-3 h-3 text-electric-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>You're most active during morning hours</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-lg border border-neon-500/20">
                <h3 className="text-sm font-orbitron text-neon-400 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Time Analysis
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Most productive day:</span>
                    <span className="text-neon-400">Tuesday</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak hours:</span>
                    <span className="text-electric-400">9-11 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average session:</span>
                    <span className="text-holographic-400">2.3 hours</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-lg border border-neon-500/20">
                <h3 className="text-sm font-orbitron text-neon-400 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Collaboration
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Shared items:</span>
                    <span className="text-neon-400">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team members:</span>
                    <span className="text-electric-400">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active projects:</span>
                    <span className="text-holographic-400">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataDashboard
