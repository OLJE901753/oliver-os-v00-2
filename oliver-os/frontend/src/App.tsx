import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { BrainInterface } from './components/brain-interface/BrainInterface'
import { CollaborationWorkspace } from './components/collaboration/CollaborationWorkspace'
import { MindVisualizer } from './components/visualization/MindVisualizer'
import { ThoughtProcessor } from './components/thought/ThoughtProcessor'
import { Navigation } from './components/layout/Navigation'
import { RealtimeStatus } from './components/status/RealtimeStatus'
import { WebSocketDebug } from './components/debug/WebSocketDebug'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { SocketProvider } from './hooks/useSocket'
import { initializeAuth } from './stores/authStore'
import { useEffect } from 'react'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth()
  }, [])

  // For development: bypass authentication temporarily
  const isDevelopment = (import.meta as any).env?.DEV || false

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-brain-900 via-brain-800 to-brain-900">
            {isDevelopment ? (
              // Development mode: show interface without auth
              <>
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<BrainInterface />} />
                    <Route path="/collaborate" element={<CollaborationWorkspace />} />
                    <Route path="/visualize" element={<MindVisualizer />} />
                    <Route path="/thoughts" element={<ThoughtProcessor />} />
                  </Routes>
                </main>
                <RealtimeStatus />
                <WebSocketDebug />
              </>
            ) : (
              // Production mode: require authentication
              <ProtectedRoute>
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<BrainInterface />} />
                    <Route path="/collaborate" element={<CollaborationWorkspace />} />
                    <Route path="/visualize" element={<MindVisualizer />} />
                    <Route path="/thoughts" element={<ThoughtProcessor />} />
                  </Routes>
                </main>
                <RealtimeStatus />
                <WebSocketDebug />
              </ProtectedRoute>
            )}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                },
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </QueryClientProvider>
  )
}

export default App
