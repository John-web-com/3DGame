import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Lobby from './pages/Lobby'
import Game from './pages/Game'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import { useAuthStore } from './stores/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/lobby" 
          element={isAuthenticated ? <Lobby /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/game" 
          element={isAuthenticated ? <Game /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/ranking" 
          element={isAuthenticated ? <Ranking /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
