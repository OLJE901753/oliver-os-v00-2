"""
Oliver-OS Knowledge Manager Service
Advanced knowledge management with Neo4j and ChromaDB integration
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import json
import uuid

# Database imports
try:
    from neo4j import GraphDatabase
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    logging.warning("Neo4j not available, using fallback implementation")

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logging.warning("ChromaDB not available, using fallback implementation")

# LangChain imports
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage

# Local imports
from config.settings import Settings

logger = logging.getLogger(__name__)


class KnowledgeManager:
    """
    Advanced knowledge management service with graph and vector database integration
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = logging.getLogger('KnowledgeManager')
        
        # Initialize databases
        self._initialize_databases()
        
        # Initialize AI models
        self._initialize_models()
        
        # Knowledge storage
        self.knowledge_graph: Dict[str, Dict[str, Any]] = {}
        self.vector_store: Dict[str, List[float]] = {}
        self.entities: Dict[str, Dict[str, Any]] = {}
        self.relationships: Dict[str, Dict[str, Any]] = {}
    
    def _initialize_databases(self):
        """Initialize database connections"""
        # Neo4j connection
        if NEO4J_AVAILABLE and self.settings.neo4j_url:
            try:
                self.neo4j_driver = GraphDatabase.driver(
                    self.settings.neo4j_url,
                    auth=(self.settings.neo4j_user, self.settings.neo4j_password)
                )
                self.logger.info("✅ Neo4j connection established")
            except Exception as e:
                self.logger.error(f"❌ Neo4j connection failed: {e}")
                self.neo4j_driver = None
        else:
            self.neo4j_driver = None
            self.logger.warning("⚠️ Neo4j not available, using fallback")
        
        # ChromaDB connection
        if CHROMADB_AVAILABLE:
            try:
                self.chroma_client = chromadb.Client(ChromaSettings(
                    host=self.settings.chroma_host,
                    port=self.settings.chroma_port
                ))
                self.collection = self.chroma_client.get_or_create_collection(
                    name="oliver_os_knowledge"
                )
                self.logger.info("✅ ChromaDB connection established")
            except Exception as e:
                self.logger.error(f"❌ ChromaDB connection failed: {e}")
                self.chroma_client = None
                self.collection = None
        else:
            self.chroma_client = None
            self.collection = None
            self.logger.warning("⚠️ ChromaDB not available, using fallback")
    
    def _initialize_models(self):
        """Initialize AI models for knowledge extraction"""
        self.models = {}
        
        if self.settings.openai_api_key:
            self.models['openai'] = ChatOpenAI(
                model=self.settings.default_model,
                api_key=self.settings.openai_api_key,
                temperature=0.3
            )
            self.embeddings = OpenAIEmbeddings(api_key=self.settings.openai_api_key)
            self.logger.info("✅ OpenAI models initialized for knowledge management")
        
        if self.settings.anthropic_api_key:
            self.models['anthropic'] = ChatAnthropic(
                model="claude-3-sonnet-20240229",
                api_key=self.settings.anthropic_api_key,
                temperature=0.3
            )
            self.logger.info("✅ Anthropic model initialized for knowledge management")
    
    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search knowledge base using semantic search
        """
        try:
            self.logger.info(f"🔍 Searching knowledge base: {query}")
            
            results = []
            
            # Vector search if ChromaDB is available
            if self.collection:
                try:
                    vector_results = self.collection.query(
                        query_texts=[query],
                        n_results=limit
                    )
                    
                    for i, (id, distance, metadata) in enumerate(zip(
                        vector_results['ids'][0],
                        vector_results['distances'][0],
                        vector_results['metadatas'][0]
                    )):
                        results.append({
                            "id": id,
                            "content": metadata.get('content', ''),
                            "type": metadata.get('type', 'unknown'),
                            "relevance_score": 1 - distance,  # Convert distance to similarity
                            "metadata": metadata
                        })
                except Exception as e:
                    self.logger.warning(f"Vector search failed: {e}")
            
            # Fallback to text search
            if not results:
                results = await self._text_search(query, limit)
            
            # Sort by relevance
            results.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
            
            self.logger.info(f"✅ Found {len(results)} results for query: {query}")
            return results[:limit]
            
        except Exception as e:
            self.logger.error(f"❌ Error searching knowledge base: {e}")
            return []
    
    async def update_graph(self, thought_id: str, thought_content: str) -> Dict[str, Any]:
        """
        Update knowledge graph with new thought
        """
        try:
            self.logger.info(f"🔄 Updating knowledge graph for thought: {thought_id}")
            
            # Extract entities and relationships
            entities = await self._extract_entities(thought_content)
            relationships = await self._extract_relationships(thought_content, entities)
            
            # Update graph database
            if self.neo4j_driver:
                await self._update_neo4j_graph(thought_id, entities, relationships)
            else:
                await self._update_fallback_graph(thought_id, entities, relationships)
            
            # Update vector store
            if self.collection:
                await self._update_vector_store(thought_id, thought_content, entities)
            else:
                await self._update_fallback_vector_store(thought_id, thought_content, entities)
            
            result = {
                "thought_id": thought_id,
                "entities_extracted": len(entities),
                "relationships_extracted": len(relationships),
                "graph_updated": True,
                "vector_updated": True,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"✅ Knowledge graph updated for {thought_id}")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error updating knowledge graph: {e}")
            return {
                "thought_id": thought_id,
                "error": str(e),
                "graph_updated": False,
                "vector_updated": False
            }
    
    async def get_related_concepts(self, concept: str, depth: int = 2) -> List[Dict[str, Any]]:
        """
        Get concepts related to a given concept
        """
        try:
            self.logger.info(f"🔗 Getting related concepts for: {concept}")
            
            if self.neo4j_driver:
                return await self._get_neo4j_related_concepts(concept, depth)
            else:
                return await self._get_fallback_related_concepts(concept, depth)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting related concepts: {e}")
            return []
    
    async def _extract_entities(self, content: str) -> List[Dict[str, Any]]:
        """Extract entities from content using AI"""
        if not self.models:
            return self._fallback_entity_extraction(content)
        
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""Extract entities from the given text. Look for:
                - People (names, roles, titles)
                - Organizations (companies, institutions, groups)
                - Locations (places, addresses, regions)
                - Concepts (ideas, topics, themes)
                - Events (activities, occurrences, happenings)
                - Objects (things, items, products)
                
                Return JSON format:
                {
                    "entities": [
                        {
                            "text": "entity text",
                            "type": "PERSON|ORGANIZATION|LOCATION|CONCEPT|EVENT|OBJECT",
                            "confidence": 0.0-1.0,
                            "context": "surrounding context"
                        }
                    ]
                }"""),
                HumanMessage(content=content)
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            result = json.loads(response.content)
            return result.get("entities", [])
            
        except Exception as e:
            self.logger.error(f"Error extracting entities: {e}")
            return self._fallback_entity_extraction(content)
    
    async def _extract_relationships(self, content: str, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract relationships between entities"""
        if not self.models or len(entities) < 2:
            return []
        
        try:
            entity_texts = [e['text'] for e in entities]
            
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""Extract relationships between the given entities in the text. Look for:
                - Semantic relationships (is-a, part-of, related-to)
                - Temporal relationships (before, after, during)
                - Causal relationships (causes, results-in, influences)
                - Spatial relationships (near, far, contains)
                - Social relationships (works-with, manages, collaborates-with)
                
                Return JSON format:
                {
                    "relationships": [
                        {
                            "source": "entity1",
                            "target": "entity2",
                            "relationship": "relationship_type",
                            "confidence": 0.0-1.0,
                            "context": "supporting context"
                        }
                    ]
                }"""),
                HumanMessage(content=f"Text: {content}\n\nEntities: {', '.join(entity_texts)}")
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            result = json.loads(response.content)
            return result.get("relationships", [])
            
        except Exception as e:
            self.logger.error(f"Error extracting relationships: {e}")
            return []
    
    async def _update_neo4j_graph(self, thought_id: str, entities: List[Dict[str, Any]], relationships: List[Dict[str, Any]]):
        """Update Neo4j graph database"""
        try:
            with self.neo4j_driver.session() as session:
                # Create thought node
                session.run(
                    "CREATE (t:Thought {id: $id, content: $content, timestamp: $timestamp})",
                    id=thought_id,
                    content="",  # Store content separately if needed
                    timestamp=datetime.utcnow().isoformat()
                )
                
                # Create entity nodes
                for entity in entities:
                    session.run(
                        """
                        MERGE (e:Entity {text: $text, type: $type})
                        SET e.confidence = $confidence, e.context = $context
                        CREATE (t:Thought {id: $thought_id})-[:CONTAINS]->(e)
                        """,
                        text=entity['text'],
                        type=entity['type'],
                        confidence=entity.get('confidence', 0.5),
                        context=entity.get('context', ''),
                        thought_id=thought_id
                    )
                
                # Create relationship edges
                for rel in relationships:
                    session.run(
                        """
                        MATCH (e1:Entity {text: $source})
                        MATCH (e2:Entity {text: $target})
                        CREATE (e1)-[r:RELATES_TO {type: $relationship, confidence: $confidence, context: $context}]->(e2)
                        """,
                        source=rel['source'],
                        target=rel['target'],
                        relationship=rel['relationship'],
                        confidence=rel.get('confidence', 0.5),
                        context=rel.get('context', '')
                    )
                
        except Exception as e:
            self.logger.error(f"Error updating Neo4j graph: {e}")
    
    async def _update_fallback_graph(self, thought_id: str, entities: List[Dict[str, Any]], relationships: List[Dict[str, Any]]):
        """Update fallback graph storage"""
        self.knowledge_graph[thought_id] = {
            "entities": entities,
            "relationships": relationships,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store entities
        for entity in entities:
            self.entities[entity['text']] = entity
        
        # Store relationships
        for rel in relationships:
            rel_id = f"{rel['source']}_{rel['target']}_{rel['relationship']}"
            self.relationships[rel_id] = rel
    
    async def _update_vector_store(self, thought_id: str, content: str, entities: List[Dict[str, Any]]):
        """Update ChromaDB vector store"""
        try:
            # Generate embedding
            if hasattr(self, 'embeddings'):
                embedding = await self.embeddings.aembed_query(content)
            else:
                # Fallback embedding (random vector)
                embedding = [0.0] * 1536  # OpenAI embedding dimension
            
            # Store in ChromaDB
            self.collection.add(
                ids=[thought_id],
                embeddings=[embedding],
                metadatas=[{
                    "content": content,
                    "type": "thought",
                    "entities": json.dumps(entities),
                    "timestamp": datetime.utcnow().isoformat()
                }]
            )
            
        except Exception as e:
            self.logger.error(f"Error updating vector store: {e}")
    
    async def _update_fallback_vector_store(self, thought_id: str, content: str, entities: List[Dict[str, Any]]):
        """Update fallback vector store"""
        # Simple text-based similarity for fallback
        self.vector_store[thought_id] = {
            "content": content,
            "entities": entities,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _text_search(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Fallback text search"""
        results = []
        query_lower = query.lower()
        
        for thought_id, data in self.vector_store.items():
            content = data.get('content', '').lower()
            if query_lower in content:
                # Simple relevance scoring
                relevance = content.count(query_lower) / len(content.split())
                results.append({
                    "id": thought_id,
                    "content": data['content'],
                    "type": "thought",
                    "relevance_score": relevance,
                    "metadata": data
                })
        
        return results
    
    async def _get_neo4j_related_concepts(self, concept: str, depth: int) -> List[Dict[str, Any]]:
        """Get related concepts from Neo4j"""
        try:
            with self.neo4j_driver.session() as session:
                result = session.run(
                    """
                    MATCH (c:Entity {text: $concept})-[r*1..$depth]-(related:Entity)
                    RETURN DISTINCT related.text as text, related.type as type, 
                           count(r) as connection_strength
                    ORDER BY connection_strength DESC
                    LIMIT 20
                    """,
                    concept=concept,
                    depth=depth
                )
                
                return [dict(record) for record in result]
                
        except Exception as e:
            self.logger.error(f"Error getting Neo4j related concepts: {e}")
            return []
    
    async def _get_fallback_related_concepts(self, concept: str, depth: int) -> List[Dict[str, Any]]:
        """Get related concepts from fallback storage"""
        related = []
        concept_lower = concept.lower()
        
        # Find entities that appear in the same thoughts
        for thought_id, data in self.knowledge_graph.items():
            entities = data.get('entities', [])
            relationships = data.get('relationships', [])
            
            # Check if concept is in this thought
            concept_found = any(
                entity['text'].lower() == concept_lower 
                for entity in entities
            )
            
            if concept_found:
                # Add other entities from the same thought
                for entity in entities:
                    if entity['text'].lower() != concept_lower:
                        related.append({
                            "text": entity['text'],
                            "type": entity['type'],
                            "connection_strength": 1
                        })
        
        # Remove duplicates and sort by connection strength
        unique_related = {}
        for item in related:
            key = item['text']
            if key not in unique_related:
                unique_related[key] = item
            else:
                unique_related[key]['connection_strength'] += 1
        
        return sorted(unique_related.values(), key=lambda x: x['connection_strength'], reverse=True)[:20]
    
    def _fallback_entity_extraction(self, content: str) -> List[Dict[str, Any]]:
        """Fallback entity extraction using simple patterns"""
        entities = []
        
        # Simple pattern-based extraction
        import re
        
        # Extract capitalized words (potential proper nouns)
        proper_nouns = re.findall(r'\b[A-Z][a-z]+\b', content)
        for noun in set(proper_nouns):
            entities.append({
                "text": noun,
                "type": "CONCEPT",
                "confidence": 0.3,
                "context": "extracted from text"
            })
        
        return entities
    
    def _get_primary_model(self) -> str:
        """Get the primary model name"""
        if 'openai' in self.models:
            return 'openai'
        elif 'anthropic' in self.models:
            return 'anthropic'
        else:
            return 'fallback'
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the knowledge manager"""
        return {
            "status": "healthy",
            "neo4j_available": self.neo4j_driver is not None,
            "chromadb_available": self.collection is not None,
            "models_available": len(self.models),
            "entities_stored": len(self.entities),
            "relationships_stored": len(self.relationships),
            "thoughts_in_graph": len(self.knowledge_graph)
        }
