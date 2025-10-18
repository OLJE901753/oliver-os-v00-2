-- Oliver-OS Database Schema
-- Enhanced AI-brain interface database setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thoughts table
CREATE TABLE thoughts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_vector VECTOR(1536), -- OpenAI embedding dimension
    type VARCHAR(50) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge graph nodes
CREATE TABLE knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge graph relationships
CREATE TABLE knowledge_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}',
    weight DECIMAL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration sessions
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    participants UUID[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time events
CREATE TABLE realtime_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI processing results
CREATE TABLE ai_processing_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE,
    processing_type VARCHAR(100) NOT NULL,
    model_name VARCHAR(255),
    input_data JSONB,
    output_data JSONB,
    confidence DECIMAL,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice recordings
CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE,
    audio_file_path TEXT,
    transcription TEXT,
    language VARCHAR(10) DEFAULT 'en',
    duration_seconds DECIMAL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mind visualizations
CREATE TABLE mind_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    visualization_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    settings JSONB DEFAULT '{}',
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX idx_thoughts_created_at ON thoughts(created_at DESC);
CREATE INDEX idx_thoughts_content_vector ON thoughts USING ivfflat (content_vector vector_cosine_ops);
CREATE INDEX idx_thoughts_content_gin ON thoughts USING gin(to_tsvector('english', content));

CREATE INDEX idx_knowledge_nodes_type ON knowledge_nodes(type);
CREATE INDEX idx_knowledge_nodes_label ON knowledge_nodes(label);
CREATE INDEX idx_knowledge_nodes_embedding ON knowledge_nodes USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_knowledge_relationships_source ON knowledge_relationships(source_id);
CREATE INDEX idx_knowledge_relationships_target ON knowledge_relationships(target_id);
CREATE INDEX idx_knowledge_relationships_type ON knowledge_relationships(relationship_type);

CREATE INDEX idx_realtime_events_session_id ON realtime_events(session_id);
CREATE INDEX idx_realtime_events_timestamp ON realtime_events(timestamp DESC);

CREATE INDEX idx_ai_processing_results_thought_id ON ai_processing_results(thought_id);
CREATE INDEX idx_ai_processing_results_type ON ai_processing_results(processing_type);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thoughts_updated_at BEFORE UPDATE ON thoughts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_nodes_updated_at BEFORE UPDATE ON knowledge_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_sessions_updated_at BEFORE UPDATE ON collaboration_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mind_visualizations_updated_at BEFORE UPDATE ON mind_visualizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create full-text search function
CREATE OR REPLACE FUNCTION search_thoughts(search_query TEXT, user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    content TEXT,
    rank REAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.content,
        ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', search_query)) as rank,
        t.created_at
    FROM thoughts t
    WHERE 
        (user_uuid IS NULL OR t.user_id = user_uuid)
        AND to_tsvector('english', t.content) @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION find_similar_thoughts(
    query_vector VECTOR(1536),
    similarity_threshold DECIMAL DEFAULT 0.7,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.content,
        1 - (t.content_vector <=> query_vector) as similarity,
        t.created_at
    FROM thoughts t
    WHERE 
        t.content_vector IS NOT NULL
        AND 1 - (t.content_vector <=> query_vector) >= similarity_threshold
    ORDER BY t.content_vector <=> query_vector
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO users (email, name, avatar_url) VALUES
('oliver@oliver-os.com', 'Oliver', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver'),
('girlfriend@oliver-os.com', 'Girlfriend', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Girlfriend');

-- Create a sample collaboration session
INSERT INTO collaboration_sessions (name, description, created_by) VALUES
('AI Brain Interface Development', 'Collaborative development of Oliver-OS AI-brain interface', (SELECT id FROM users WHERE email = 'oliver@oliver-os.com'));
