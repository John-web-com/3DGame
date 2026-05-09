import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { callFunction, isCloudMode } from '../lib/cloudbase'
import './Ranking.css'

interface RankingItem {
  userId: string
  username: string
  score: number
  level: number
}

export default function Ranking() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      setLoading(true)
      const result = await callFunction('getRanking')
      setRankings(result.result.list || [])
    } catch (error) {
      console.error('获取排行榜失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return '#ffd700'
    if (index === 1) return '#c0c0c0'
    if (index === 2) return '#cd7f32'
    return '#64748b'
  }

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <button onClick={() => navigate('/lobby')} className="back-btn">← 返回大厅</button>
        <h1>🏆 排行榜</h1>
        <p>实时更新 · 前10名玩家 {!isCloudMode && <span className="mode-badge local-mode">本地模式</span>}</p>
      </div>

      <div className="ranking-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="empty-state">
            <p>暂无排名数据，快来挑战吧！</p>
          </div>
        ) : (
          <table className="ranking-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>玩家</th>
                <th>分数</th>
                <th>等级</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((item, index) => (
                <tr 
                  key={item.userId} 
                  className={user?.id === item.userId ? 'current-user' : ''}
                >
                  <td>
                    <span 
                      className="rank-badge"
                      style={{ background: getMedalColor(index) }}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td>{item.username}</td>
                  <td className="score-cell">{item.score}</td>
                  <td>Lv.{item.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={fetchRankings} className="refresh-btn">
        🔄 刷新排行榜
      </button>
    </div>
  )
}
