import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { callFunction, db } from '../lib/cloudbase'
import './Login.css'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        // 注册
        const regResult = await callFunction('userAuth', {
          action: 'register',
          username,
          password
        })
        
        if (!regResult.result?.success) {
          throw new Error(regResult.result?.message || '注册失败')
        }
        
        // 注册成功后自动登录
        const result = await callFunction('userAuth', {
          action: 'login',
          username,
          password
        })
        
        if (!result.result?.success) {
          throw new Error(result.result?.message || '登录失败')
        }
        
        setUser(result.result.user)
      } else {
        // 登录
        const result = await callFunction('userAuth', {
          action: 'login',
          username,
          password
        })
        
        if (!result.result?.success) {
          throw new Error(result.result?.message || '登录失败')
        }
        
        setUser(result.result.user)
      }
      
      navigate('/lobby')
    } catch (err: any) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🎮 3D坐标系闯关游戏</h1>
          <p>在三维空间中挑战你的空间感知能力</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
          </button>

          <button 
            type="button" 
            className="switch-btn"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </form>
      </div>
    </div>
  )
}
