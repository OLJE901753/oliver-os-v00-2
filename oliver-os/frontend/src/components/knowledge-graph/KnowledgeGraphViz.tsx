/**
 * Knowledge Graph Visualization Component
 * Interactive graph visualization using React Flow
 * Features: Node creation/editing, relationship visualization, search/filter, auto-linking status
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Panel,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Link as LinkIcon,
  Network,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Save,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Types from backend
interface KnowledgeNode {
  id: string;
  type: 'business_idea' | 'project' | 'person' | 'concept' | 'task' | 'note';
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeRelationship {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'related_to' | 'depends_on' | 'part_of' | 'inspired_by' | 'mentions';
  strength?: number;
  metadata?: Record<string, unknown>;
}

interface NodeData {
  node: KnowledgeNode;
  connections: number;
}

interface EdgeData {
  relationship: KnowledgeRelationship;
}

// Custom Node Component
const CustomNode: React.FC<{ data: NodeData }> = ({ data }) => {
  const { node, connections } = data;
  
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'business_idea':
        return '#F59E0B'; // amber
      case 'project':
        return '#8B5CF6'; // purple
      case 'person':
        return '#10B981'; // green
      case 'concept':
        return '#00D4FF'; // cyan
      case 'task':
        return '#EF4444'; // red
      case 'note':
        return '#3B82F6'; // blue
      default:
        return '#6B7280'; // gray
    }
  };

  const color = getNodeColor(node.type);

  return (
    <div
      className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-[200px]"
      style={{
        backgroundColor: `${color}15`,
        borderColor: color,
        boxShadow: `0 0 20px ${color}40`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase mb-1" style={{ color }}>
            {node.type.replace('_', ' ')}
          </div>
          <div className="text-sm font-bold text-white mb-1">{node.title}</div>
          {node.content && (
            <div className="text-xs text-gray-400 line-clamp-2">{node.content}</div>
          )}
        </div>
      </div>
      
      {node.tags && node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {node.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full"
              style={{
                backgroundColor: `${color}30`,
                color: color,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
        <div className="flex items-center text-xs text-gray-400">
          <Network className="w-3 h-3 mr-1" />
          {connections}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(node.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

// Custom Edge Component
const CustomEdge: React.FC<{ data?: EdgeData }> = ({ data }) => {
  const getEdgeColor = (type?: string) => {
    switch (type) {
      case 'related_to':
        return '#00D4FF';
      case 'depends_on':
        return '#EF4444';
      case 'part_of':
        return '#8B5CF6';
      case 'inspired_by':
        return '#F59E0B';
      case 'mentions':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const color = getEdgeColor(data?.relationship?.type);

  return (
    <div className="relative">
      <div
        className="absolute inset-0 opacity-30 blur-sm"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface KnowledgeGraphVizProps {
  className?: string;
}

const KnowledgeGraphViz: React.FC<KnowledgeGraphVizProps> = ({ className = '' }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [showAutoLinkStatus, setShowAutoLinkStatus] = useState(true);
  const queryClient = useQueryClient();

  const API_BASE = 'http://localhost:3000/api/knowledge';

  // Fetch nodes
  const { data: nodesData, isLoading: nodesLoading } = useQuery({
    queryKey: ['knowledge-graph', 'nodes', filterType],
    queryFn: async () => {
      const url = filterType !== 'all' ? `${API_BASE}/nodes?type=${filterType}` : `${API_BASE}/nodes`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch nodes');
      const data = await res.json();
      return data.nodes as KnowledgeNode[];
    },
  });

  // Fetch relationships
  const { data: relationshipsData } = useQuery({
    queryKey: ['knowledge-graph', 'relationships'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/relationships`);
      if (!res.ok) throw new Error('Failed to fetch relationships');
      const data = await res.json();
      return data.relationships as KnowledgeRelationship[];
    },
  });

  // Fetch auto-linking status
  const { data: autoLinkStatus } = useQuery({
    queryKey: ['knowledge-graph', 'auto-link-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        enabled: data.automaticLinkingEnabled || false,
        lastLinked: data.lastAutoLink || null,
        totalAutoLinks: data.totalAutoLinks || 0,
      };
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create node mutation
  const createNodeMutation = useMutation({
    mutationFn: async (nodeData: {
      type: KnowledgeNode['type'];
      title: string;
      content: string;
      tags?: string[];
    }) => {
      const res = await fetch(`${API_BASE}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData),
      });
      if (!res.ok) throw new Error('Failed to create node');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-graph'] });
      setIsCreatingNode(false);
      toast.success('Node created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create node: ${error.message}`);
    },
  });

  // Update node mutation
  const updateNodeMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<KnowledgeNode> & { id: string }) => {
      const res = await fetch(`${API_BASE}/nodes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update node');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-graph'] });
      setIsEditingNode(false);
      setSelectedNodeId(null);
      toast.success('Node updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update node: ${error.message}`);
    },
  });

  // Delete node mutation
  const deleteNodeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/nodes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete node');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-graph'] });
      setSelectedNodeId(null);
      toast.success('Node deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete node: ${error.message}`);
    },
  });

  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: async (relData: {
      fromNodeId: string;
      toNodeId: string;
      type: KnowledgeRelationship['type'];
      strength?: number;
    }) => {
      const res = await fetch(`${API_BASE}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relData),
      });
      if (!res.ok) throw new Error('Failed to create relationship');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-graph', 'relationships'] });
      toast.success('Relationship created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create relationship: ${error.message}`);
    },
  });

  // Transform nodes to React Flow format
  useEffect(() => {
    if (!nodesData) return;

    const flowNodes: Node<NodeData>[] = nodesData.map((node, index) => {
      // Count connections for this node
      const connections = relationshipsData?.filter(
        (rel) => rel.fromNodeId === node.id || rel.toNodeId === node.id
      ).length || 0;

      // Position nodes in a circle initially
      const angle = (index / nodesData.length) * Math.PI * 2;
      const radius = 300;
      const x = Math.cos(angle) * radius + 400;
      const y = Math.sin(angle) * radius + 400;

      return {
        id: node.id,
        type: 'custom',
        position: { x, y },
        data: {
          node,
          connections,
        },
      };
    });

    setNodes(flowNodes);
  }, [nodesData, relationshipsData, setNodes]);

  // Transform relationships to React Flow edges
  useEffect(() => {
    if (!relationshipsData) return;

    const flowEdges: Edge<EdgeData>[] = relationshipsData.map((rel) => ({
      id: rel.id,
      source: rel.fromNodeId,
      target: rel.toNodeId,
      type: 'smoothstep',
      animated: true,
      style: {
        strokeWidth: 2 + (rel.strength || 0.5) * 2,
        stroke: getEdgeColor(rel.type),
      },
      label: rel.type.replace('_', ' '),
      labelStyle: { fill: getEdgeColor(rel.type), fontWeight: 600 },
      data: {
        relationship: rel,
      },
    }));

    setEdges(flowEdges);
  }, [relationshipsData, setEdges]);

  const getEdgeColor = (type: string) => {
    switch (type) {
      case 'related_to':
        return '#00D4FF';
      case 'depends_on':
        return '#EF4444';
      case 'part_of':
        return '#8B5CF6';
      case 'inspired_by':
        return '#F59E0B';
      case 'mentions':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      createRelationshipMutation.mutate({
        fromNodeId: params.source,
        toNodeId: params.target,
        type: 'related_to',
        strength: 0.5,
      });
    },
    [createRelationshipMutation]
  );

  const filteredNodes = useMemo(() => {
    if (!nodesData) return [];
    return nodesData.filter((node) => {
      const matchesSearch =
        !searchTerm ||
        node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || node.type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [nodesData, searchTerm, filterType]);

  const selectedNode = nodesData?.find((n) => n.id === selectedNodeId);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-neon-500/20 glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-orbitron text-neon-400 flex items-center">
            <Network className="w-5 h-5 mr-2" />
            Knowledge Graph Visualization
          </h2>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreatingNode(true)}
              className="p-2 bg-neon-500 text-black rounded-lg shadow-neon-blue hover:bg-neon-400 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Node
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAutoLinkStatus(!showAutoLinkStatus)}
              className={`p-2 rounded-lg transition-all ${
                showAutoLinkStatus
                  ? 'bg-neon-500 text-black shadow-neon-blue'
                  : 'text-neon-400 border border-neon-500/30 hover:bg-neon-500/10'
              }`}
            >
              {showAutoLinkStatus ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search nodes..."
              className="wireframe-input w-full pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="wireframe-input text-sm"
          >
            <option value="all">All Types</option>
            <option value="business_idea">Business Ideas</option>
            <option value="project">Projects</option>
            <option value="person">People</option>
            <option value="concept">Concepts</option>
            <option value="task">Tasks</option>
            <option value="note">Notes</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 mt-4 text-sm text-gray-300">
          <div>
            <span className="text-neon-400 font-orbitron">{nodes.length}</span> nodes
          </div>
          <div>
            <span className="text-electric-400 font-orbitron">{edges.length}</span> relationships
          </div>
          {nodesLoading && (
            <div className="text-amber-400">Loading...</div>
          )}
        </div>
      </div>

      {/* Auto-linking Status */}
      {showAutoLinkStatus && autoLinkStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-black/40 border-b border-neon-500/20 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Zap className={`w-4 h-4 ${autoLinkStatus.enabled ? 'text-green-400' : 'text-gray-500'}`} />
            <span className="text-sm text-gray-300">
              Auto-linking: <span className={autoLinkStatus.enabled ? 'text-green-400' : 'text-gray-500'}>
                {autoLinkStatus.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </span>
            {autoLinkStatus.enabled && (
              <>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-400">
                  {autoLinkStatus.totalAutoLinks} auto-links created
                </span>
                {autoLinkStatus.lastLinked && (
                  <>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400">
                      Last: {new Date(autoLinkStatus.lastLinked).toLocaleTimeString()}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Graph Canvas */}
      <div className="flex-1 relative bg-black/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          nodeTypes={nodeTypes}
          fitView
          className="bg-black/40"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Node Creation Modal */}
      <AnimatePresence>
        {isCreatingNode && (
          <NodeEditModal
            onClose={() => setIsCreatingNode(false)}
            onSave={(data) => createNodeMutation.mutate(data)}
            isLoading={createNodeMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Node Edit Modal */}
      <AnimatePresence>
        {isEditingNode && selectedNode && (
          <NodeEditModal
            node={selectedNode}
            onClose={() => {
              setIsEditingNode(false);
              setSelectedNodeId(null);
            }}
            onSave={(data) => updateNodeMutation.mutate({ id: selectedNode.id, ...data })}
            onDelete={() => deleteNodeMutation.mutate(selectedNode.id)}
            isLoading={updateNodeMutation.isPending || deleteNodeMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Node Details Panel */}
      {selectedNode && !isEditingNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 glass-card p-4 rounded-lg border border-neon-500/30 shadow-neon-blue max-w-md"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-orbitron text-white">{selectedNode.title}</h3>
              <p className="text-sm text-gray-400 capitalize">{selectedNode.type.replace('_', ' ')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditingNode(true)}
                className="p-2 text-neon-400 hover:text-neon-300 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this node?')) {
                    deleteNodeMutation.mutate(selectedNode.id);
                  }
                }}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-3">{selectedNode.content}</p>
          {selectedNode.tags && selectedNode.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedNode.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-neon-500/20 text-neon-400 text-xs rounded-full border border-neon-500/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Node Edit Modal Component
interface NodeEditModalProps {
  node?: KnowledgeNode;
  onClose: () => void;
  onSave: (data: {
    type: KnowledgeNode['type'];
    title: string;
    content: string;
    tags?: string[];
  }) => void;
  onDelete?: () => void;
  isLoading: boolean;
}

const NodeEditModal: React.FC<NodeEditModalProps> = ({
  node,
  onClose,
  onSave,
  onDelete,
  isLoading,
}) => {
  const [type, setType] = useState<KnowledgeNode['type']>(node?.type || 'concept');
  const [title, setTitle] = useState(node?.title || '');
  const [content, setContent] = useState(node?.content || '');
  const [tags, setTags] = useState<string[]>(node?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    onSave({ type, title, content, tags });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 rounded-lg border border-neon-500/30 shadow-neon-blue max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-orbitron text-neon-400">
            {node ? 'Edit Node' : 'Create New Node'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as KnowledgeNode['type'])}
              className="wireframe-input w-full"
              disabled={!!node}
            >
              <option value="business_idea">Business Idea</option>
              <option value="project">Project</option>
              <option value="person">Person</option>
              <option value="concept">Concept</option>
              <option value="task">Task</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="wireframe-input w-full"
              placeholder="Enter node title..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="wireframe-input w-full min-h-[150px]"
              placeholder="Enter node content..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Tags</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="wireframe-input flex-1"
                placeholder="Add tag..."
              />
              <button
                onClick={handleAddTag}
                className="p-2 bg-neon-500 text-black rounded-lg hover:bg-neon-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-neon-500/20 text-neon-400 text-sm rounded-full border border-neon-500/30 flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          )}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-neon-500 text-black rounded-lg hover:bg-neon-400 transition-colors flex items-center shadow-neon-blue"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default KnowledgeGraphViz;

