import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { callFunction } from '../lib/cloudbase'
import './Profile.css'

interface HistoryRecord {
  score: number
  level: number
  timeElapsed?: number
  createdAt?: string
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchHistory()
  }, [user])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await callFunction('getMyScores', { userId: user!.id })
      setHistory(res.result.list || [])
    } catch (e) {
      console.error('获取历史分数失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const formatTime = (ts?: string) => {
    if (!ts) return '-'
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={() => navigate('/lobby')} className="back-btn">← 返回大厅</button>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h2>{user.username}</h2>
            <p className="user-id">ID: {user.id}</p>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">当前等级</span>
              <span className="stat-value">{user.level || 1}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">游戏局数</span>
              <span className="stat-value">{history.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最高分</span>
              <span className="stat-value">{history.length > 0 ? Math.max(...history.map(h => h.score)) : '-'}</span>
            </div>
          </div>

          {/* 历史分数 */}
          <div className="history-section">
            <div className="history-header">
              <h3>📋 游戏历史</h3>
              <button onClick={fetchHistory} className="refresh-small">刷新</button>
            </div>

            {loading ? (
              <div className="loading-hint">加载中...</div>
            ) : history.length === 0 ? (
              <div className="empty-hint">暂无游戏记录，快去挑战吧！</div>
            ) : (
              <div className="history-list">
                {history.map((record, i) => (
                  <div key={i} className="history-row">
                    <span className="history-rank">#{i + 1}</span>
                    <span className="history-score">{record.score}分</span>
                    <span className="history-level">Lv.{record.level}</span>
                    <span className="history-time">{formatTime(record.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button onClick={() => navigate('/game')} className="action-btn primary">
              🎮 开始游戏
            </button>
            <button onClick={() => navigate('/ranking')} className="action-btn secondary">
              🏆 查看排行
            </button>
            <button onClick={handleLogout} className="action-btn danger">
              🚪 退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
