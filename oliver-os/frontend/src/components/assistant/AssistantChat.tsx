/**
 * Assistant Chat UI Component
 * Complete chat interface with session management, proactive suggestions, citations, and history
 * Following BMAD principles: Break, Map, Automate, Document
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Send,
  Bot,
  User,
  MessageSquare,
  Sparkles,
  BookOpen,
  Clock,
  X,
  Plus,
  Search,
  Loader,
  Lightbulb,
  Link as LinkIcon,
  ChevronRight,
  ChevronLeft,
  History,
  RefreshCw,
} from 'lucide-react';

// Types
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  contextNodes?: string[];
  timestamp?: string;
}

interface ChatSession {
  id: string;
  userId: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
}

interface ChatResponse {
  sessionId: string;
  message: string;
  suggestions?: Suggestion[];
  citations?: Citation[];
  contextNodes: string[];
}

interface Suggestion {
  type: 'review_node' | 'create_link' | 'explore_topic' | 'refine_idea';
  title: string;
  description: string;
  nodeId?: string;
  action?: string;
}

interface Citation {
  nodeId: string;
  title: string;
  excerpt: string;
}

const API_BASE = 'http://localhost:3000/api/assistant';

// Message Component
const MessageBubble: React.FC<{
  message: ChatMessage;
  citations?: Citation[];
}> = ({ message, citations }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-neon-500 text-black'
            : 'bg-black/40 border border-neon-500/30 text-neon-400'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block p-3 rounded-lg ${
            isUser
              ? 'bg-neon-500 text-black'
              : 'bg-black/40 border border-neon-500/30 text-white'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          
          {message.timestamp && (
            <div className={`text-xs mt-2 ${isUser ? 'text-black/60' : 'text-gray-400'}`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Citations */}
        {citations && citations.length > 0 && !isUser && (
          <div className="mt-2 space-y-1">
            {citations.map((citation, idx) => (
              <motion.div
                key={citation.nodeId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-2 bg-black/40 border border-neon-500/20 rounded text-xs"
              >
                <div className="flex items-start space-x-2">
                  <BookOpen className="w-3 h-3 text-neon-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-neon-400 font-semibold">{citation.title}</div>
                    <div className="text-gray-400 mt-1 line-clamp-2">{citation.excerpt}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Proactive Suggestions Component
const SuggestionsPanel: React.FC<{
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
}> = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) return null;

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'review_node':
        return <BookOpen className="w-4 h-4" />;
      case 'create_link':
        return <LinkIcon className="w-4 h-4" />;
      case 'explore_topic':
        return <Sparkles className="w-4 h-4" />;
      case 'refine_idea':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-black/40 border border-neon-500/30 rounded-lg mb-4"
    >
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-4 h-4 text-neon-400" />
        <span className="text-sm font-semibold text-neon-400">Proactive Suggestions</span>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full p-3 bg-black/40 border border-neon-500/20 rounded-lg hover:border-neon-500/50 transition-all text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="text-neon-400 mt-0.5">{getSuggestionIcon(suggestion.type)}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{suggestion.title}</div>
                <div className="text-xs text-gray-400 mt-1">{suggestion.description}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// Session List Component
const SessionList: React.FC<{
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}> = ({ sessions, currentSessionId, onSelectSession, onNewSession }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-neon-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neon-400 flex items-center">
            <History className="w-4 h-4 mr-2" />
            Chat History
          </h3>
          <button
            onClick={onNewSession}
            className="p-2 bg-neon-500 text-black rounded-lg hover:bg-neon-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                currentSessionId === session.id
                  ? 'bg-neon-500/20 border border-neon-500/50'
                  : 'bg-black/20 border border-neon-500/10 hover:border-neon-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-400">
                  {new Date(session.startedAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">{session.messageCount} messages</div>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(session.lastMessageAt).toLocaleTimeString()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Chat Component
const AssistantChat: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lastCitations, setLastCitations] = useState<Citation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['assistant', 'sessions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      return data.data as ChatSession[];
    },
  });

  // Fetch session messages
  const { data: sessionMessages } = useQuery({
    queryKey: ['assistant', 'session', currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return [];
      const res = await fetch(`${API_BASE}/sessions/${currentSessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session messages');
      const data = await res.json();
      return data.data.messages as ChatMessage[];
    },
    enabled: !!currentSessionId,
  });

  // Fetch proactive suggestions
  const { data: suggestionsData } = useQuery({
    queryKey: ['assistant', 'suggestions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/suggestions`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.data as Suggestion[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update messages when session changes
  useEffect(() => {
    if (sessionMessages) {
      setMessages(sessionMessages);
    } else {
      setMessages([]);
    }
  }, [sessionMessages]);

  // Update suggestions
  useEffect(() => {
    if (suggestionsData) {
      setSuggestions(suggestionsData);
    }
  }, [suggestionsData]);

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      return data.data as ChatSession;
    },
    onSuccess: (session) => {
      setCurrentSessionId(session.id);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['assistant', 'sessions'] });
      toast.success('New chat session started');
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          message,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      return data.data as ChatResponse;
    },
    onSuccess: (response) => {
      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: input,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        contextNodes: response.contextNodes,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update session ID if new session was created
      if (response.sessionId !== currentSessionId) {
        setCurrentSessionId(response.sessionId);
      }

      // Update suggestions and citations
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
      if (response.citations) {
        setLastCitations(response.citations);
      }

      setInput('');
      queryClient.invalidateQueries({ queryKey: ['assistant', 'session', response.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['assistant', 'sessions'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    if (!currentSessionId) {
      createSessionMutation.mutate();
    }

    sendMessageMutation.mutate(input);
  }, [input, currentSessionId, sendMessageMutation, createSessionMutation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.action) {
      setInput(suggestion.action);
    } else if (suggestion.type === 'review_node' && suggestion.nodeId) {
      setInput(`Tell me about node ${suggestion.nodeId}`);
      handleSend();
    }
  };

  const handleNewSession = () => {
    createSessionMutation.mutate();
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setLastCitations([]);
  };

  // Get citations for the last assistant message
  const getCitationsForMessage = (messageIndex: number): Citation[] => {
    if (messageIndex === messages.length - 1 && lastCitations.length > 0) {
      return lastCitations;
    }
    return [];
  };

  return (
    <div className={`h-full flex ${className}`}>
      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-neon-500/20 bg-black/20 flex-shrink-0 overflow-hidden"
          >
            <SessionList
              sessions={sessionsData || []}
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neon-500/20 glass-panel">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {showHistory ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-neon-400" />
                <h2 className="text-lg font-orbitron text-neon-400">AI Assistant</h2>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNewSession}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="New Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-neon-400/50 mb-4" />
              <h3 className="text-xl font-orbitron text-neon-400 mb-2">Start a conversation</h3>
              <p className="text-gray-400 max-w-md">
                Ask me anything about your knowledge graph, request ideas to be refined, or explore
                your thoughts.
              </p>
            </div>
          )}

          {/* Proactive Suggestions */}
          {suggestions.length > 0 && messages.length === 0 && (
            <SuggestionsPanel suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
          )}

          {/* Messages */}
          {messages.map((message, idx) => (
            <MessageBubble
              key={idx}
              message={message}
              citations={message.role === 'assistant' ? getCitationsForMessage(idx) : undefined}
            />
          ))}

          {sendMessageMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-black/40 border border-neon-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-neon-400" />
              </div>
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin text-neon-400" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions Bar */}
        {suggestions.length > 0 && messages.length > 0 && (
          <div className="px-4 py-2 border-t border-neon-500/20">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-xs text-gray-400 flex-shrink-0">Suggestions:</span>
              {suggestions.slice(0, 3).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 bg-black/40 border border-neon-500/20 rounded-full text-xs text-neon-400 hover:border-neon-500/50 transition-colors flex-shrink-0 whitespace-nowrap"
                >
                  {suggestion.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-neon-500/20 glass-panel">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="wireframe-input w-full min-h-[60px] max-h-[200px] resize-none pr-12"
                rows={1}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {input.length}
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMessageMutation.isPending}
              className="p-3 bg-neon-500 text-black rounded-lg hover:bg-neon-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-neon-blue"
            >
              {sendMessageMutation.isPending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantChat;

