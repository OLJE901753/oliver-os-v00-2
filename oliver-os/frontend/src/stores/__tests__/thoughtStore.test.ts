import { describe, it, expect, beforeEach } from 'vitest'
import { useThoughtStore } from '../thoughtStore'

describe('thoughtStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useThoughtStore.getState().clearThoughts()
  })

  it('should add a thought', () => {
    const store = useThoughtStore.getState()
    
    store.addThought({
      content: 'Test thought',
      processed: false,
    })
    
    // Get fresh state after mutation
    const currentState = useThoughtStore.getState()
    expect(currentState.thoughts).toHaveLength(1)
    expect(currentState.thoughts[0].content).toBe('Test thought')
    expect(currentState.thoughts[0].processed).toBe(false)
  })

  it('should update a thought', () => {
    const store = useThoughtStore.getState()
    
    // Add a thought first
    store.addThought({
      content: 'Test thought',
      processed: false,
    })
    
    const currentState = useThoughtStore.getState()
    const thoughtId = currentState.thoughts[0].id
    
    store.updateThought(thoughtId, {
      processed: true,
      insights: ['Test insight'],
    })
    
    const updatedState = useThoughtStore.getState()
    const updatedThought = updatedState.thoughts.find(t => t.id === thoughtId)
    expect(updatedThought?.processed).toBe(true)
    expect(updatedThought?.insights).toEqual(['Test insight'])
  })

  it('should remove a thought', () => {
    const store = useThoughtStore.getState()
    
    // Add a thought first
    store.addThought({
      content: 'Test thought',
      processed: false,
    })
    
    const currentState = useThoughtStore.getState()
    const thoughtId = currentState.thoughts[0].id
    
    store.removeThought(thoughtId)
    
    const updatedState = useThoughtStore.getState()
    expect(updatedState.thoughts).toHaveLength(0)
    expect(updatedState.thoughts.find(t => t.id === thoughtId)).toBeUndefined()
  })

  it('should search thoughts', () => {
    const store = useThoughtStore.getState()
    
    // Add test thoughts
    store.addThought({
      content: 'JavaScript is awesome',
      processed: true,
      tags: ['programming'],
    })
    
    store.addThought({
      content: 'React is great for UI',
      processed: true,
      tags: ['react', 'ui'],
    })
    
    const currentState = useThoughtStore.getState()
    const results = currentState.searchThoughts('JavaScript')
    expect(results).toHaveLength(1)
    expect(results[0].content).toBe('JavaScript is awesome')
  })
})
