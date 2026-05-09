import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import './Lobby.css'

export default function Lobby() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="lobby-container">
      <div className="lobby-background">
        <div className="grid-lines"></div>
      </div>
      
      <div className="lobby-content">
        <div className="user-info">
          <h2>欢迎回来，{user?.username}</h2>
          <p className="level-info">当前等级：Lv.{user?.level || 1}</p>
        </div>

        <div className="compass-container">
          <h3 className="compass-title">🎯 控制罗盘</h3>
          
          <div className="menu-grid">
            <button 
              className="menu-btn start-game"
              onClick={() => navigate('/game')}
            >
              <div className="btn-icon">🎮</div>
              <span>开始游戏</span>
            </button>

            <button 
              className="menu-btn ranking"
              onClick={() => navigate('/ranking')}
            >
              <div className="btn-icon">🏆</div>
              <span>排行榜</span>
            </button>

            <button 
              className="menu-btn profile"
              onClick={() => navigate('/profile')}
            >
              <div className="btn-icon">👤</div>
              <span>个人信息</span>
            </button>

            <button 
              className="menu-btn logout"
              onClick={handleLogout}
            >
              <div className="btn-icon">🚪</div>
              <span>退出账号</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
