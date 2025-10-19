import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Thought {
  id: string
  content: string
  timestamp: string
  processed: boolean
  insights?: string[]
  tags?: string[]
  confidence?: number
  processingTime?: number
}

interface ThoughtStore {
  thoughts: Thought[]
  processingStatus: string | null
  isProcessing: boolean
  addThought: (thought: Omit<Thought, 'id' | 'timestamp'>) => void
  updateThought: (id: string, updates: Partial<Thought>) => void
  removeThought: (id: string) => void
  setProcessingStatus: (status: string | null) => void
  setIsProcessing: (isProcessing: boolean) => void
  clearThoughts: () => void
  getThoughtById: (id: string) => Thought | undefined
  getThoughtsByTag: (tag: string) => Thought[]
  searchThoughts: (query: string) => Thought[]
}

export const useThoughtStore = create<ThoughtStore>()(
  devtools(
    (set, get) => ({
      thoughts: [],
      processingStatus: null,
      isProcessing: false,

      addThought: (thoughtData) => {
        const newThought: Thought = {
          ...thoughtData,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        }
        
        set((state) => ({
          thoughts: [newThought, ...state.thoughts],
        }))
      },

      updateThought: (id, updates) => {
        set((state) => ({
          thoughts: state.thoughts.map((thought) =>
            thought.id === id ? { ...thought, ...updates } : thought
          ),
        }))
      },

      removeThought: (id) => {
        set((state) => ({
          thoughts: state.thoughts.filter((thought) => thought.id !== id),
        }))
      },

      setProcessingStatus: (status) => {
        set({ processingStatus: status })
      },

      setIsProcessing: (isProcessing) => {
        set({ isProcessing })
      },

      clearThoughts: () => {
        set({ thoughts: [] })
      },

      getThoughtById: (id) => {
        return get().thoughts.find((thought) => thought.id === id)
      },

      getThoughtsByTag: (tag) => {
        return get().thoughts.filter((thought) =>
          thought.tags?.includes(tag)
        )
      },

      searchThoughts: (query) => {
        const lowercaseQuery = query.toLowerCase()
        return get().thoughts.filter((thought) =>
          thought.content.toLowerCase().includes(lowercaseQuery) ||
          thought.insights?.some(insight => 
            insight.toLowerCase().includes(lowercaseQuery)
          ) ||
          thought.tags?.some(tag => 
            tag.toLowerCase().includes(lowercaseQuery)
          )
        )
      },
    }),
    {
      name: 'thought-store',
    }
  )
)
