import { useRef, useCallback, useEffect, useState } from 'react'
import './VirtualJoystick.css'

interface VirtualJoystickProps {
  onMove: (direction: { x: number; y: number; z: number }) => void
}

export default function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const positionRef = useRef({ x: 0, y: 0 })
  const [mode, setMode] = useState<'xy' | 'z'>('xy')

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    setActive(true)
    handleMove(e.touches[0].clientX, e.touches[0].clientY)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (!active) return
    handleMove(e.touches[0].clientX, e.touches[0].clientY)
  }, [active])

  const handleTouchEnd = useCallback(() => {
    setActive(false)
    positionRef.current = { x: 0, y: 0 }
    onMove({ x: 0, y: 0, z: 0 })
  }, [onMove])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return

    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    let deltaX = (clientX - centerX) / (rect.width / 2.2)
    let deltaY = (clientY - centerY) / (rect.height / 2.2)

    // 限制在圆形范围内
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (distance > 1) {
      deltaX /= distance
      deltaY /= distance
    }

    positionRef.current = { x: deltaX, y: -deltaY }
    
    if (mode === 'xy') {
      onMove({ x: deltaX, y: 0, z: -deltaY })
    } else {
      onMove({ x: 0, y: -deltaY, z: 0 })
    }
  }, [onMove, mode])

  return (
    <div className="joystick-container">
      {/* XY轴摇杆 */}
      <div className={`joystick-wrapper ${active ? 'active' : ''}`}>
        <div
          ref={joystickRef}
          className={`joystick-base ${mode === 'xy' ? 'primary' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="joystick-stick"
            style={{
              transform: `translate(${positionRef.current.x * 38}px, ${-positionRef.current.y * 38}px)`
            }}
          >
            <span className="joystick-label">{mode === 'xy' ? 'X/Y' : 'Z'}</span>
          </div>
        </div>
      </div>

      {/* 模式切换 */}
      <div className="mode-switcher">
        <button 
          className={`mode-btn ${mode === 'xy' ? 'active' : ''}`}
          onClick={() => setMode('xy')}
        >
          X/Y 轴
        </button>
        <button 
          className={`mode-btn ${mode === 'z' ? 'active' : ''}`}
          onClick={() => setMode('z')}
        >
          Z 轴
        </button>
      </div>

      <p className="joystick-hint">拖拽摇杆控制移动</p>
    </div>
  )
}
