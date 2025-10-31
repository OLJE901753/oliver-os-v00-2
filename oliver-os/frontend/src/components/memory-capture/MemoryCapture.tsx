/**
 * Memory Capture Interface
 * Quick capture form, voice capture, timeline view, search, and processing status
 * Following BMAD principles: Break, Map, Automate, Document
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Mic,
  MicOff,
  Search,
  Clock,
  CheckCircle,
  Loader,
  AlertCircle,
  FileText,
  X,
  Save,
  Play,
  Pause,
  Send,
  Filter,
  Calendar,
  TrendingUp,
} from 'lucide-react';

// Types
interface MemoryRecord {
  id: string;
  rawContent: string;
  type: 'text' | 'voice' | 'email';
  status: 'raw' | 'processing' | 'organized' | 'linked';
  metadata?: Record<string, unknown>;
  audioUrl?: string;
  transcript?: string;
  durationSeconds?: number;
  timestamp: string;
  createdAt: string;
}

interface MemoryStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  queueSize: number;
  processingRate: number;
}

const API_BASE = 'http://localhost:3000/api/memory';

// Quick Capture Form Component
const QuickCaptureForm: React.FC<{
  onCapture: (content: string) => void;
  isRecording?: boolean;
}> = ({ onCapture, isRecording = false }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onCapture(content);
      setContent('');
      toast.success('Memory captured!');
    } catch (error) {
      toast.error('Failed to capture memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isRecording ? 'Listening...' : 'Quick capture your thoughts...'}
          className="wireframe-input w-full min-h-[120px] resize-none pr-12"
          disabled={isRecording || isSubmitting}
          autoFocus
        />
        <div className="absolute bottom-2 right-2 flex items-center space-x-2">
          <span className="text-xs text-gray-500">{content.length}</span>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting || isRecording}
            className="p-2 bg-neon-500 text-black rounded-lg hover:bg-neon-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

// Voice Capture Component
const VoiceCapture: React.FC<{
  onTranscript: (transcript: string) => void;
}> = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setTranscript(current);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        toast.error(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        if (isRecording) {
          // Restart if still recording
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // In a real implementation, upload to server for processing
        // For now, just use the transcript
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    if (transcript.trim()) {
      onTranscript(transcript);
      setTranscript('');
      toast.success('Voice capture saved!');
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
        <AlertCircle className="w-4 h-4 inline mr-2" />
        Voice capture is not supported in your browser. Please use Chrome or Edge.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-neon-500 text-black hover:bg-neon-400'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div>
            <div className="text-sm font-semibold text-white">
              {isRecording ? 'Recording...' : 'Voice Capture'}
            </div>
            {isRecording && (
              <div className="text-xs text-gray-400">Click to stop</div>
            )}
          </div>
        </div>
        {isRecording && (
          <div className="flex items-center space-x-2 text-red-400">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-xs">Live</span>
          </div>
        )}
      </div>
      
      {transcript && (
        <div className="p-3 bg-black/40 border border-neon-500/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Transcript:</div>
          <div className="text-sm text-white">{transcript}</div>
        </div>
      )}
    </div>
  );
};

// Memory Timeline Component
const MemoryTimeline: React.FC<{
  memories: MemoryRecord[];
  onMemoryClick: (memory: MemoryRecord) => void;
}> = ({ memories, onMemoryClick }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'raw':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'organized':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'linked':
        return <CheckCircle className="w-4 h-4 text-neon-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'raw':
        return 'border-gray-600 bg-gray-900/40';
      case 'processing':
        return 'border-blue-500 bg-blue-900/20';
      case 'organized':
        return 'border-green-500 bg-green-900/20';
      case 'linked':
        return 'border-neon-500 bg-neon-900/20';
      default:
        return 'border-gray-600 bg-gray-900/40';
    }
  };

  const groupedMemories = memories.reduce((acc, memory) => {
    const date = new Date(memory.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(memory);
    return acc;
  }, {} as Record<string, MemoryRecord[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedMemories).map(([date, dayMemories]) => (
        <div key={date} className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neon-500/20" />
          
          {/* Date header */}
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-black/40 border-2 border-neon-500/30 flex items-center justify-center z-10">
              <Calendar className="w-5 h-5 text-neon-400" />
            </div>
            <div className="ml-4">
              <div className="text-lg font-orbitron text-neon-400">{date}</div>
              <div className="text-xs text-gray-400">{dayMemories.length} memories</div>
            </div>
          </div>

          {/* Memories */}
          <div className="ml-16 space-y-4">
            {dayMemories.map((memory) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onMemoryClick(memory)}
                className={`p-4 rounded-lg border-2 cursor-pointer hover:border-neon-500/50 transition-all ${getStatusColor(memory.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(memory.status)}
                    <span className="text-xs uppercase text-gray-400">{memory.status}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400 capitalize">{memory.type}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(memory.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="text-sm text-white mb-2 line-clamp-2">
                  {memory.transcript || memory.rawContent}
                </div>
                
                {memory.durationSeconds && (
                  <div className="text-xs text-gray-500">
                    Duration: {Math.round(memory.durationSeconds)}s
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Processing Status Indicator
const ProcessingStatus: React.FC<{
  stats: MemoryStats | undefined;
}> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="p-4 bg-black/40 border border-neon-500/30 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neon-400 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Processing Status
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Total Memories</div>
          <div className="text-lg font-orbitron text-neon-400">{stats.total}</div>
        </div>
        <div>
          <div className="text-gray-400">In Queue</div>
          <div className="text-lg font-orbitron text-blue-400">{stats.queueSize}</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">By Status:</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="px-2 py-1 bg-black/40 rounded text-xs flex items-center"
            >
              <span className="text-gray-300 capitalize">{status}:</span>
              <span className="ml-1 text-neon-400 font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Memory Capture Component
const MemoryCapture: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'capture' | 'timeline' | 'search'>('capture');
  const [selectedMemory, setSelectedMemory] = useState<MemoryRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Capture mutation
  const captureMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`${API_BASE}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: content,
          type: 'text',
        }),
      });
      if (!res.ok) throw new Error('Failed to capture memory');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  // Voice capture mutation
  const voiceCaptureMutation = useMutation({
    mutationFn: async (transcript: string) => {
      const res = await fetch(`${API_BASE}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: transcript,
          type: 'voice',
          transcript,
        }),
      });
      if (!res.ok) throw new Error('Failed to capture voice memory');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  // Fetch timeline
  const { data: timelineData } = useQuery({
    queryKey: ['memories', 'timeline'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/timeline`);
      if (!res.ok) throw new Error('Failed to fetch timeline');
      const data = await res.json();
      return data.memories as MemoryRecord[];
    },
  });

  // Search memories
  const { data: searchResults } = useQuery({
    queryKey: ['memories', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Failed to search memories');
      const data = await res.json();
      return data.results as MemoryRecord[];
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['memories', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json() as MemoryStats;
    },
    refetchInterval: 5000,
  });

  const handleCapture = async (content: string) => {
    await captureMutation.mutateAsync(content);
  };

  const handleVoiceTranscript = async (transcript: string) => {
    await voiceCaptureMutation.mutateAsync(transcript);
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-neon-500/20 glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-orbitron text-neon-400 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Memory Capture
          </h2>
          <ProcessingStatus stats={stats} />
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('capture')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'capture'
                ? 'bg-neon-500 text-black shadow-neon-blue'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Capture
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'timeline'
                ? 'bg-neon-500 text-black shadow-neon-blue'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'search'
                ? 'bg-neon-500 text-black shadow-neon-blue'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Search
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'capture' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Capture</h3>
              <QuickCaptureForm
                onCapture={handleCapture}
                isRecording={false}
              />
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Voice Capture</h3>
              <VoiceCapture onTranscript={handleVoiceTranscript} />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-4xl mx-auto">
            {timelineData && timelineData.length > 0 ? (
              <MemoryTimeline
                memories={timelineData}
                onMemoryClick={setSelectedMemory}
              />
            ) : (
              <div className="text-center text-gray-400 py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div>No memories yet. Start capturing your thoughts!</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="max-w-3xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="wireframe-input w-full pl-10 pr-4 py-3"
              />
            </div>
            
            {searchResults && searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((memory) => (
                  <div
                    key={memory.id}
                    onClick={() => setSelectedMemory(memory)}
                    className="p-4 bg-black/40 border border-neon-500/30 rounded-lg cursor-pointer hover:border-neon-500/50 transition-all"
                  >
                    <div className="text-sm text-white mb-2">{memory.rawContent}</div>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="capitalize">{memory.type}</span>
                      <span>•</span>
                      <span>{new Date(memory.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span className="capitalize">{memory.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center text-gray-400 py-12">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div>No results found for "{searchQuery}"</div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div>Enter a search query to find memories</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <MemoryDetailModal
            memory={selectedMemory}
            onClose={() => setSelectedMemory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Memory Detail Modal
const MemoryDetailModal: React.FC<{
  memory: MemoryRecord;
  onClose: () => void;
}> = ({ memory, onClose }) => {
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
          <h3 className="text-xl font-orbitron text-neon-400">Memory Details</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Status</div>
            <div className="text-sm text-white capitalize">{memory.status}</div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">Content</div>
            <div className="text-sm text-white whitespace-pre-wrap">{memory.rawContent}</div>
          </div>

          {memory.transcript && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Transcript</div>
              <div className="text-sm text-gray-300">{memory.transcript}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Type</div>
              <div className="text-white capitalize">{memory.type}</div>
            </div>
            <div>
              <div className="text-gray-400">Created</div>
              <div className="text-white">{new Date(memory.timestamp).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MemoryCapture;

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

