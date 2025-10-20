"""
Oliver-OS Visualization Generator Service
Generate mind maps, knowledge graphs, and other visualizations
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import json
import uuid

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage

# Local imports
from config.settings import Settings

logger = logging.getLogger(__name__)


class VisualizationGenerator:
    """
    Visualization generation service for mind maps, knowledge graphs, and data visualizations
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = logging.getLogger('VisualizationGenerator')
        
        # Initialize AI models
        self._initialize_models()
        
        # Visualization storage
        self.visualizations: Dict[str, Dict[str, Any]] = {}
        self.mind_maps: Dict[str, Dict[str, Any]] = {}
        self.knowledge_graphs: Dict[str, Dict[str, Any]] = {}
    
    def _initialize_models(self):
        """Initialize AI models for visualization generation"""
        self.models = {}
        
        if self.settings.openai_api_key:
            self.models['openai'] = ChatOpenAI(
                model=self.settings.default_model,
                api_key=self.settings.openai_api_key,
                temperature=0.7
            )
            self.logger.info("✅ OpenAI model initialized for visualization generation")
        
        if self.settings.anthropic_api_key:
            self.models['anthropic'] = ChatAnthropic(
                model="claude-3-sonnet-20240229",
                api_key=self.settings.anthropic_api_key,
                temperature=0.7
            )
            self.logger.info("✅ Anthropic model initialized for visualization generation")
    
    async def generate_mind_map(self, thought_ids: List[str]) -> Dict[str, Any]:
        """
        Generate a mind map from thought IDs
        """
        try:
            self.logger.info(f"🗺️ Generating mind map for {len(thought_ids)} thoughts")
            
            # For now, we'll generate a mock mind map
            # In a real implementation, this would fetch thought data and create actual visualizations
            
            mind_map_id = f"mind_map_{int(datetime.utcnow().timestamp())}"
            
            # Generate mind map structure using AI
            mind_map_structure = await self._generate_mind_map_structure(thought_ids)
            
            mind_map = {
                "id": mind_map_id,
                "type": "mind_map",
                "thought_ids": thought_ids,
                "structure": mind_map_structure,
                "nodes": mind_map_structure.get("nodes", []),
                "edges": mind_map_structure.get("edges", []),
                "created_at": datetime.utcnow().isoformat(),
                "metadata": {
                    "node_count": len(mind_map_structure.get("nodes", [])),
                    "edge_count": len(mind_map_structure.get("edges", [])),
                    "complexity": self._calculate_complexity(mind_map_structure)
                }
            }
            
            self.mind_maps[mind_map_id] = mind_map
            
            self.logger.info(f"✅ Mind map generated: {mind_map_id}")
            return mind_map
            
        except Exception as e:
            self.logger.error(f"❌ Error generating mind map: {e}")
            return {
                "id": f"error_{int(datetime.utcnow().timestamp())}",
                "type": "mind_map",
                "error": str(e),
                "nodes": [],
                "edges": []
            }
    
    async def generate_knowledge_graph(self, center_thought_id: str, depth: int = 2) -> Dict[str, Any]:
        """
        Generate a knowledge graph centered around a thought
        """
        try:
            self.logger.info(f"🕸️ Generating knowledge graph for thought: {center_thought_id}")
            
            graph_id = f"knowledge_graph_{int(datetime.utcnow().timestamp())}"
            
            # Generate knowledge graph structure
            graph_structure = await self._generate_knowledge_graph_structure(center_thought_id, depth)
            
            knowledge_graph = {
                "id": graph_id,
                "type": "knowledge_graph",
                "center_thought_id": center_thought_id,
                "depth": depth,
                "structure": graph_structure,
                "nodes": graph_structure.get("nodes", []),
                "edges": graph_structure.get("edges", []),
                "created_at": datetime.utcnow().isoformat(),
                "metadata": {
                    "node_count": len(graph_structure.get("nodes", [])),
                    "edge_count": len(graph_structure.get("edges", [])),
                    "max_depth": depth,
                    "complexity": self._calculate_complexity(graph_structure)
                }
            }
            
            self.knowledge_graphs[graph_id] = knowledge_graph
            
            self.logger.info(f"✅ Knowledge graph generated: {graph_id}")
            return knowledge_graph
            
        except Exception as e:
            self.logger.error(f"❌ Error generating knowledge graph: {e}")
            return {
                "id": f"error_{int(datetime.utcnow().timestamp())}",
                "type": "knowledge_graph",
                "error": str(e),
                "nodes": [],
                "edges": []
            }
    
    async def generate_data_visualization(self, data: Dict[str, Any], visualization_type: str) -> Dict[str, Any]:
        """
        Generate data visualization from structured data
        """
        try:
            self.logger.info(f"📊 Generating {visualization_type} visualization")
            
            viz_id = f"viz_{int(datetime.utcnow().timestamp())}"
            
            # Generate visualization based on type
            if visualization_type == "bar_chart":
                viz_structure = await self._generate_bar_chart(data)
            elif visualization_type == "line_chart":
                viz_structure = await self._generate_line_chart(data)
            elif visualization_type == "pie_chart":
                viz_structure = await self._generate_pie_chart(data)
            elif visualization_type == "scatter_plot":
                viz_structure = await self._generate_scatter_plot(data)
            elif visualization_type == "network_graph":
                viz_structure = await self._generate_network_graph(data)
            else:
                viz_structure = await self._generate_generic_visualization(data, visualization_type)
            
            visualization = {
                "id": viz_id,
                "type": visualization_type,
                "data": data,
                "structure": viz_structure,
                "created_at": datetime.utcnow().isoformat(),
                "metadata": {
                    "data_points": len(data.get("values", [])),
                    "complexity": self._calculate_complexity(viz_structure)
                }
            }
            
            self.visualizations[viz_id] = visualization
            
            self.logger.info(f"✅ {visualization_type} visualization generated: {viz_id}")
            return visualization
            
        except Exception as e:
            self.logger.error(f"❌ Error generating {visualization_type} visualization: {e}")
            return {
                "id": f"error_{int(datetime.utcnow().timestamp())}",
                "type": visualization_type,
                "error": str(e),
                "structure": {}
            }
    
    async def _generate_mind_map_structure(self, thought_ids: List[str]) -> Dict[str, Any]:
        """Generate mind map structure using AI"""
        if not self.models:
            return self._generate_fallback_mind_map(thought_ids)
        
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""Generate a mind map structure for the given thought IDs. Create a hierarchical structure with:
                - Central node (main theme)
                - Primary branches (major categories)
                - Secondary branches (subcategories)
                - Leaf nodes (specific thoughts)
                
                Return JSON format:
                {
                    "nodes": [
                        {
                            "id": "node_id",
                            "label": "Node Label",
                            "type": "central|primary|secondary|leaf",
                            "thought_id": "thought_id_if_leaf",
                            "position": {"x": 0, "y": 0},
                            "color": "#color_code",
                            "size": 1-5
                        }
                    ],
                    "edges": [
                        {
                            "source": "node_id",
                            "target": "node_id",
                            "type": "hierarchical|associative",
                            "strength": 0.0-1.0
                        }
                    ]
                }"""),
                HumanMessage(content=f"Generate mind map for thoughts: {', '.join(thought_ids)}")
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            result = json.loads(response.content)
            return result
            
        except Exception as e:
            self.logger.error(f"Error generating mind map structure: {e}")
            return self._generate_fallback_mind_map(thought_ids)
    
    async def _generate_knowledge_graph_structure(self, center_thought_id: str, depth: int) -> Dict[str, Any]:
        """Generate knowledge graph structure using AI"""
        if not self.models:
            return self._generate_fallback_knowledge_graph(center_thought_id, depth)
        
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content=f"""Generate a knowledge graph structure centered around thought {center_thought_id} with depth {depth}.
                
                Create a network structure with:
                - Central node (the main thought)
                - Related concepts and entities
                - Relationships between nodes
                - Hierarchical levels based on depth
                
                Return JSON format:
                {{
                    "nodes": [
                        {{
                            "id": "node_id",
                            "label": "Node Label",
                            "type": "thought|concept|entity|relationship",
                            "thought_id": "thought_id_if_applicable",
                            "position": {{"x": 0, "y": 0}},
                            "color": "#color_code",
                            "size": 1-5,
                            "level": 0-{depth}
                        }}
                    ],
                    "edges": [
                        {{
                            "source": "node_id",
                            "target": "node_id",
                            "type": "relates_to|is_a|part_of|causes",
                            "strength": 0.0-1.0,
                            "label": "relationship_label"
                        }}
                    ]
                }}"""),
                HumanMessage(content=f"Generate knowledge graph for thought: {center_thought_id}")
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            result = json.loads(response.content)
            return result
            
        except Exception as e:
            self.logger.error(f"Error generating knowledge graph structure: {e}")
            return self._generate_fallback_knowledge_graph(center_thought_id, depth)
    
    async def _generate_bar_chart(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate bar chart structure"""
        return {
            "chart_type": "bar",
            "data": data,
            "config": {
                "x_axis": data.get("x_axis", "Categories"),
                "y_axis": data.get("y_axis", "Values"),
                "colors": ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"]
            }
        }
    
    async def _generate_line_chart(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate line chart structure"""
        return {
            "chart_type": "line",
            "data": data,
            "config": {
                "x_axis": data.get("x_axis", "Time"),
                "y_axis": data.get("y_axis", "Values"),
                "colors": ["#3B82F6", "#EF4444", "#10B981"]
            }
        }
    
    async def _generate_pie_chart(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate pie chart structure"""
        return {
            "chart_type": "pie",
            "data": data,
            "config": {
                "colors": ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"]
            }
        }
    
    async def _generate_scatter_plot(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate scatter plot structure"""
        return {
            "chart_type": "scatter",
            "data": data,
            "config": {
                "x_axis": data.get("x_axis", "X Values"),
                "y_axis": data.get("y_axis", "Y Values"),
                "colors": ["#3B82F6"]
            }
        }
    
    async def _generate_network_graph(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate network graph structure"""
        return {
            "graph_type": "network",
            "data": data,
            "config": {
                "layout": "force_directed",
                "node_size": "degree",
                "edge_width": "weight"
            }
        }
    
    async def _generate_generic_visualization(self, data: Dict[str, Any], viz_type: str) -> Dict[str, Any]:
        """Generate generic visualization structure"""
        return {
            "chart_type": viz_type,
            "data": data,
            "config": {
                "title": f"{viz_type.title()} Visualization",
                "colors": ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"]
            }
        }
    
    def _generate_fallback_mind_map(self, thought_ids: List[str]) -> Dict[str, Any]:
        """Generate fallback mind map structure"""
        nodes = []
        edges = []
        
        # Create central node
        central_id = f"central_{uuid.uuid4().hex[:8]}"
        nodes.append({
            "id": central_id,
            "label": "Central Theme",
            "type": "central",
            "position": {"x": 0, "y": 0},
            "color": "#3B82F6",
            "size": 5
        })
        
        # Create nodes for each thought
        for i, thought_id in enumerate(thought_ids):
            node_id = f"thought_{i}_{uuid.uuid4().hex[:8]}"
            angle = (2 * 3.14159 * i) / len(thought_ids)
            radius = 100
            
            nodes.append({
                "id": node_id,
                "label": f"Thought {i+1}",
                "type": "leaf",
                "thought_id": thought_id,
                "position": {
                    "x": radius * 1.5 * (angle / 3.14159),
                    "y": radius * 1.5 * (angle / 3.14159)
                },
                "color": "#10B981",
                "size": 3
            })
            
            # Create edge to central node
            edges.append({
                "source": central_id,
                "target": node_id,
                "type": "hierarchical",
                "strength": 0.8
            })
        
        return {"nodes": nodes, "edges": edges}
    
    def _generate_fallback_knowledge_graph(self, center_thought_id: str, depth: int) -> Dict[str, Any]:
        """Generate fallback knowledge graph structure"""
        nodes = []
        edges = []
        
        # Create central node
        central_id = f"center_{uuid.uuid4().hex[:8]}"
        nodes.append({
            "id": central_id,
            "label": f"Thought: {center_thought_id}",
            "type": "thought",
            "thought_id": center_thought_id,
            "position": {"x": 0, "y": 0},
            "color": "#3B82F6",
            "size": 5,
            "level": 0
        })
        
        # Create related nodes
        for level in range(1, depth + 1):
            for i in range(3):  # 3 nodes per level
                node_id = f"node_{level}_{i}_{uuid.uuid4().hex[:8]}"
                angle = (2 * 3.14159 * i) / 3
                radius = level * 80
                
                nodes.append({
                    "id": node_id,
                    "label": f"Concept {level}-{i+1}",
                    "type": "concept",
                    "position": {
                        "x": radius * 1.2 * (angle / 3.14159),
                        "y": radius * 1.2 * (angle / 3.14159)
                    },
                    "color": "#10B981" if level == 1 else "#F59E0B",
                    "size": 4 - level,
                    "level": level
                })
                
                # Create edge
                if level == 1:
                    edges.append({
                        "source": central_id,
                        "target": node_id,
                        "type": "relates_to",
                        "strength": 0.7,
                        "label": "relates to"
                    })
                else:
                    # Connect to previous level
                    prev_node_id = f"node_{level-1}_{i}_{uuid.uuid4().hex[:8]}"
                    edges.append({
                        "source": prev_node_id,
                        "target": node_id,
                        "type": "relates_to",
                        "strength": 0.5,
                        "label": "relates to"
                    })
        
        return {"nodes": nodes, "edges": edges}
    
    def _calculate_complexity(self, structure: Dict[str, Any]) -> str:
        """Calculate complexity level of visualization structure"""
        node_count = len(structure.get("nodes", []))
        edge_count = len(structure.get("edges", []))
        
        total_elements = node_count + edge_count
        
        if total_elements < 10:
            return "simple"
        elif total_elements < 25:
            return "medium"
        else:
            return "complex"
    
    def _get_primary_model(self) -> str:
        """Get the primary model name"""
        if 'openai' in self.models:
            return 'openai'
        elif 'anthropic' in self.models:
            return 'anthropic'
        else:
            return 'fallback'
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the visualization generator"""
        return {
            "status": "healthy",
            "models_available": len(self.models),
            "model_names": list(self.models.keys()),
            "mind_maps_generated": len(self.mind_maps),
            "knowledge_graphs_generated": len(self.knowledge_graphs),
            "visualizations_generated": len(self.visualizations)
        }
