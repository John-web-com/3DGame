import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import ThreeAxisController from '../components/ThreeAxisController'
import './Game.css'

interface GameUIProps {
  onNextLevel: () => void
}

export default function GameUI({ onNextLevel }: GameUIProps) {
  const navigate = useNavigate()
  const level = useGameStore((state) => state.level)
  const score = useGameStore((state) => state.score)
  const timeElapsed = useGameStore((state) => state.timeElapsed)
  const isPlaying = useGameStore((state) => state.isPlaying)
  const isVictory = useGameStore((state) => state.isVictory)
  const targetPosition = useGameStore((state) => state.targetPosition)
  const playerPosition = useGameStore((state) => state.playerPosition)

  // 用 ref 存最新位置，避免闭包陷阱
  const positionRef = useRef({ x: 0, y: 0, z: 0 })
  positionRef.current = playerPosition

  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition)

  // ========== 键盘控制 ==========
  // 与坐标系统一：X轴(AD)=水平左右 | Y轴(WS)=水平前后 | Z轴(QE)=垂直上下
  useEffect(() => {
    if (!isPlaying || isVictory) return

    const keysPressed = new Set<string>()
    let animationId: number

    const handleKeyDown = (e: KeyboardEvent) => keysPressed.add(e.key.toLowerCase())
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.key.toLowerCase())

    const speed = 0.15
    const move = () => {
      const pos = positionRef.current
      let dx = 0, dy = 0, dz = 0

      // X轴水平左右：A=左 D=右 → player.x
      if (keysPressed.has('a') || keysPressed.has('arrowleft')) dx -= speed
      if (keysPressed.has('d') || keysPressed.has('arrowright')) dx += speed

      // Y轴水平前后：W=前 S=后 → player.z（场景绿线沿Z方向）
      if (keysPressed.has('w') || keysPressed.has('arrowup')) dz -= speed
      if (keysPressed.has('s') || keysPressed.has('arrowdown')) dz += speed

      // Z轴垂直上下：Q=上 E=下 → player.y（场景蓝线沿Y方向）
      if (keysPressed.has('q')) dy += speed
      if (keysPressed.has('e')) dy -= speed

      if (dx !== 0 || dy !== 0 || dz !== 0) {
        updatePlayerPosition({
          x: pos.x + dx,
          y: pos.y + dy,
          z: pos.z + dz,
        })
      }
      animationId = requestAnimationFrame(move)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    move()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(animationId)
    }
  }, [isPlaying, isVictory, updatePlayerPosition])

  // ========== 操控盘回调 ==========
  // 操控盘与坐标系统一：
  //   X推杆 → player.x（红线沿X方向=水平左右）
  //   Y推杆 → player.z（绿线沿Z方向=水平前后）
  //   Z推杆 → player.y（蓝线沿Y方向=垂直上下）
  const handleControllerMove = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    if (!isPlaying || isVictory) return
    const pos = positionRef.current
    const speed = 0.28

    switch (axis) {
      case 'x':
        updatePlayerPosition({ x: pos.x + value * speed })   // X轴：水平左右
        break
      case 'y':
        updatePlayerPosition({ z: pos.z + value * speed })   // Y轴：水平前后(绿线沿Z)
        break
      case 'z':
        updatePlayerPosition({ y: pos.y + value * speed })   // Z轴：垂直上下(蓝线沿Y)
        break
    }
  }, [isPlaying, isVictory, updatePlayerPosition])

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '00:00'
    const s = Math.max(0, Math.floor(seconds))
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      {/* 游戏信息面板 */}
      <div className="game-hud">
        <button className="back-to-lobby-btn" onClick={() => navigate('/lobby')} title="返回大厅">
          ← 大厅
        </button>
        <div className="hud-item">
          <span className="hud-label">关卡</span>
          <span className="hud-value">{level}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">得分</span>
          <span className="hud-value">{score}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">时间</span>
          <span className={`hud-value ${timeElapsed <= 10 ? 'time-warning' : ''}`}>
            {formatTime(timeElapsed)}
          </span>
        </div>
        <div className="hud-item coordinates">
          <span className="hud-label">坐标</span>
          <span className="hud-value coord-text">
            ({playerPosition.x.toFixed(1)}, {playerPosition.y.toFixed(1)}, {playerPosition.z.toFixed(1)})
          </span>
        </div>
        <div className="hud-item target-coord">
          <span className="hud-label">目标</span>
          <span className="hud-value target-text">
            ({targetPosition.x.toFixed(1)}, {targetPosition.y.toFixed(1)}, {targetPosition.z.toFixed(1)})
          </span>
        </div>
      </div>

      {/* 三轴操控盘 - XYZ圆形空推杆 */}
      <ThreeAxisController
        onMove={handleControllerMove}
        disabled={!isPlaying || isVictory}
      />

      {/* 左下角键盘说明 */}
      <div className="controls-hint">
        <div className="hint-title">⌨️ 键盘</div>
        <div className="hint-grid">
          <div className="hint-row"><span>前</span><kbd>W</kbd></div>
          <div className="hint-row"><span>左<kbd>A</kbd> 右<kbd>D</kbd></span><span><kbd>S</kbd> 后</span></div>
          <div className="hint-row"><span>上<kbd>Q</kbd> 下<kbd>E</kbd></span></div>
        </div>
        <div className="hint-extra">AD:X轴 | WS:Y轴 | QE:Z轴 | 推杆+/-:0.1</div>
      </div>

      {/* 胜利弹窗 */}
      {isVictory && (
        <div className="victory-overlay" onClick={onNextLevel}>
          <div className="victory-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 关卡完成！</h2>
            <div className="victory-stats">
              <p>第 {level} 关通过！</p>
              <p>剩余时间：{formatTime(timeElapsed)}</p>
              <p>当前总分：{score}</p>
            </div>
            <button onClick={onNextLevel} className="next-level-btn">
              进入下一关 →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
