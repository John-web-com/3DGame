import { useState, useCallback, useRef, useEffect } from 'react'
import './ThreeAxisController.css'

interface ThreeAxisControllerProps {
  onMove: (axis: 'x' | 'y' | 'z', value: number) => void
  disabled?: boolean
}

/**
 * 单轴圆形空推杆 - 上下推动
 * 上推=正值(+)  下推=负值(-)
 * 不操作时推杆头在胶囊正中间(value=0)
 */
function JoystickStick({
  axis,
  label,
  color,
  onValueChange,
  disabled = false,
}: {
  axis: 'x' | 'y' | 'z'
  label: string
  color: string
  onValueChange: (axis: 'x' | 'y' | 'z', value: number) => void
  disabled?: boolean
}) {
  const baseRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [value, setValue] = useState(0) // 默认值=0，居中

  // 根据触摸/鼠标Y位置计算值：上推=正，下推=负
  const calcVal = useCallback((clientY: number) => {
    if (!baseRef.current) return 0
    const rect = baseRef.current.getBoundingClientRect()
    const centerY = rect.top + rect.height / 2
    const range = rect.height / 2 - 14 // 推杆活动范围（减小偏移提高灵敏度）
    let v = (centerY - clientY) / range   // 手指在中心上方→正值（上推）
    v = Math.max(-1, Math.min(1, v))
    return v
  }, [])

  // 开始拖动
  const startDrag = useCallback((clientY: number) => {
    if (disabled) return
    setIsDragging(true)
    const v = calcVal(clientY)
    setValue(v)
    onValueChange(axis, v)
  }, [disabled, calcVal, axis, onValueChange])

  // 拖动中
  const onDrag = useCallback((clientY: number) => {
    if (!isDragging || disabled) return
    const v = calcVal(clientY)
    setValue(v)
    onValueChange(axis, v)
  }, [isDragging, disabled, calcVal, axis, onValueChange])

  // 结束拖动 → 回到0
  const endDrag = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    setValue(0)
    onValueChange(axis, 0)
  }, [isDragging, axis, onValueChange])

  useEffect(() => {
    if (!isDragging || disabled) return
    const onMouseMove = (e: MouseEvent) => onDrag(e.clientY)
    const onMouseUp = () => endDrag()
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [isDragging, disabled, onDrag, endDrag])

  // +/- 按钮：每次增减0.1
  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    const nv = Math.min(1, value + 0.1)
    setValue(nv)
    onValueChange(axis, nv)
  }

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    const nv = Math.max(-1, value - 0.1)
    setValue(nv)
    onValueChange(axis, nv)
  }

  return (
    <div className={`joy-col ${axis} ${isDragging ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
      {/* 标签 */}
      <div className="joy-header">
        <span className="joy-label" style={{ color }}>{label}</span>
        <span className="joy-val" style={{ color }}>{value.toFixed(1)}</span>
      </div>

      {/* + 按钮 */}
      <button className="j-btn j-btn-p" onClick={handlePlus} disabled={disabled}
        style={{ borderColor: color, color }} title="+0.1">+</button>

      {/* 圆形空推杆底座 */}
      <div className="joy-base" ref={baseRef}
        onMouseDown={(e) => startDrag(e.clientY)}
        onTouchStart={(e) => { e.preventDefault(); startDrag(e.touches[0].clientY) }}
        onTouchMove={(e) => { e.preventDefault(); onDrag(e.touches[0].clientY) }}
        onTouchEnd={() => endDrag()}
      >
        {/* 背景圆 */}
        <div className="joy-bg" />

        {/* 十字刻度线 */}
        <div className="joy-cross">
          <span className="cross-h" />
          <span className="cross-v" />
        </div>

        {/* 方向箭头 */}
        <div className="joy-arrows">
          <span className="arr-up">↑</span>
          <span className="arr-down">↓</span>
        </div>

        {/* 推杆头：绝对定位居中，用translateY上下偏移 */}
        <div className="joy-knob" style={{
          transform: `translate(-50%, calc(-50% + ${-(value * 42)}px))`,
          borderColor: isDragging ? color : `${color}66`,
          boxShadow: isDragging
            ? `0 0 14px ${color}aa, inset 0 1px 3px rgba(255,255,255,0.25)`
            : `0 3px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.15)`,
          background: isDragging
            ? `radial-gradient(circle at 30% 30%, ${color}22, transparent 60%), linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))`
            : undefined,
        }}>
          <span className="knob-txt">{axis.toUpperCase()}</span>
        </div>

        {isDragging && <div className="joy-glow" style={{ background: color }} />}
      </div>

      {/* - 按钮 */}
      <button className="j-btn j-btn-m" onClick={handleMinus} disabled={disabled}
        style={{ borderColor: color, color }} title="-0.1">-</button>
    </div>
  )
}

/* ============================
   三轴控制器主组件
   X/Y/Z 全部圆形空推杆，统一样式
   ============================ */
export default function ThreeAxisController({ onMove, disabled = false }: ThreeAxisControllerProps) {
  return (
    <div className="three-axis-controller">
      <JoystickStick axis="x" label="X 轴" color="#ef4444" onValueChange={onMove} disabled={disabled} />
      <JoystickStick axis="y" label="Y 轴" color="#22c55e" onValueChange={onMove} disabled={disabled} />
      <JoystickStick axis="z" label="Z 轴" color="#3b82f6" onValueChange={onMove} disabled={disabled} />
    </div>
  )
}
