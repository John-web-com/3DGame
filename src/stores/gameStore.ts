import { create } from 'zustand'

export interface Vector3 {
  x: number
  y: number
  z: number
}

// 几何体类型
export type GeometryType = 'box' | 'sphere' | 'cone' | 'cylinder' | 'torus' | 'dodecahedron' | 'octahedron' | 'tetrahedron'

export interface Obstacle {
  id: string
  position: Vector3
  size: [number, number, number]
  color: string
  geometryType: GeometryType
}

interface GameState {
  level: number
  score: number
  timeElapsed: number
  isPlaying: boolean
  isVictory: boolean
  targetPosition: Vector3
  targetSize: [number, number, number]
  targetColor: string
  targetGeometry: GeometryType
  playerPosition: Vector3
  playerColor: string
  obstacles: Obstacle[]
  
  setLevel: (level: number) => void
  addScore: (points: number) => void
  setTimeElapsed: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setIsVictory: (victory: boolean) => void
  setTarget: (position: Vector3, size: [number, number, number]) => void
  updatePlayerPosition: (position: Partial<Vector3>) => void
  generateLevel: (levelNum: number) => void
  resetGame: () => void
}

const generateRandomPosition = (range: number): Vector3 => ({
  x: Math.floor(Math.random() * range * 2) - range,
  y: Math.floor(Math.random() * range * 2) - range,
  z: Math.floor(Math.random() * range * 2) - range,
})

// 随机尺寸生成器
const generateRandomSize = (): [number, number, number] => [
  Math.random() * 1.5 + 0.6,
  Math.random() * 1.5 + 0.6,
  Math.random() * 1.5 + 0.6,
]

// 丰富的颜色调色板 - 每关随机选择主题色系
const COLOR_PALETTES = [
  // 紫色系
  ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
  // 蓝色系
  ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
  // 绿色系
  ['#22c55e', '#4ade80', '#86efac', '#16a34a', '#15803d'],
  // 橙色系
  ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#c2410c'],
  // 粉色系
  ['#ec4899', '#f472b6', '#f9a8d4', '#db2777', '#be185d'],
  // 青色系
  ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2', '#0e7490'],
  // 黄色系
  ['#eab308', '#facc15', '#fde047', '#ca8a04', '#a16207'],
  // 红色系
  ['#ef4444', '#f87171', '#fca5a5', '#dc2626', '#b91c1c'],
  // 薰衣草紫
  ['#a855f7', '#c084fc', '#d8b4fe', '#9333ea', '#7e22ce'],
  // 翡翠绿
  ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'],
]

// 几何体类型列表
const GEOMETRY_TYPES: GeometryType[] = ['box', 'sphere', 'cone', 'cylinder', 'torus', 'dodecahedron', 'octahedron', 'tetrahedron']

// 随机选择颜色
const randomColorFromPalette = (paletteIndex?: number): string => {
  if (paletteIndex !== undefined) {
    const palette = COLOR_PALETTES[paletteIndex % COLOR_PALETTES.length]
    return palette[Math.floor(Math.random() * palette.length)]
  }
  const allColors = COLOR_PALETTES.flat()
  return allColors[Math.floor(Math.random() * allColors.length)]
}

// 随机选择几何体类型
const randomGeometryType = (): GeometryType => {
  return GEOMETRY_TYPES[Math.floor(Math.random() * GEOMETRY_TYPES.length)]
}

// 全局计时器引用（在store外部，不受React生命周期影响）
let countdownInterval: ReturnType<typeof setInterval> | null = null

export const useGameStore = create<GameState>((set, get) => ({
  level: 1,
  score: 0,
  timeElapsed: 120,
  isPlaying: false,
  isVictory: false,
  targetPosition: { x: 5, y: 3, z: -4 },
  targetSize: [1, 1, 1],
  targetColor: '#6366f1',
  targetGeometry: 'box',
  playerPosition: { x: 0, y: 0, z: 0 },
  playerColor: '#22c55e',
  obstacles: [],

  setLevel: (level) => set({ level }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  setTimeElapsed: (time) => set({ timeElapsed: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsVictory: (victory) => set({ isVictory: victory }),
  
  setTarget: (position, size) => set({ 
    targetPosition: position, 
    targetSize: size 
  }),

  updatePlayerPosition: (position) => set((state) => ({
    playerPosition: { ...state.playerPosition, ...position }
  })),

  generateLevel: (levelNum) => {
    const range = Math.min(5 + levelNum, 15)
    const obstacleCount = Math.min(3 + Math.floor(levelNum / 2), 12)
    
    // 本关卡使用的颜色调色板索引（基于关卡号变化）
    const paletteIndex = levelNum - 1
    
    const targetPos = generateRandomPosition(range)
    // 确保目标不会太靠近原点
    if (Math.abs(targetPos.x) < 3 && Math.abs(targetPos.y) < 3 && Math.abs(targetPos.z) < 3) {
      targetPos.x += targetPos.x >= 0 ? 3 : -3
      targetPos.y += targetPos.y >= 0 ? 3 : -3
    }
    
    const targetSize = generateRandomSize()
    
    // 随机目标样式
    const targetColor = randomColorFromPalette(paletteIndex)
    const targetGeometry = randomGeometryType()
    
    // 随机玩家颜色（与目标形成对比）
    let playerColor: string
    do {
      playerColor = randomColorFromPalette((paletteIndex + 2) % COLOR_PALETTES.length)
    } while (playerColor === targetColor)
    
    const obstacles: Obstacle[] = Array.from({ length: obstacleCount }, (_, i) => ({
      id: `obstacle-${i}`,
      position: generateRandomPosition(range),
      size: generateRandomSize(),
      color: randomColorFromPalette(paletteIndex),
      geometryType: randomGeometryType()
    })).filter(obs => 
      !(Math.abs(obs.position.x - targetPos.x) < 3 &&
        Math.abs(obs.position.y - targetPos.y) < 3 &&
        Math.abs(obs.position.z - targetPos.z) < 3)
    )

    set({
      level: levelNum,
      isPlaying: true,
      isVictory: false,
      targetPosition: targetPos,
      targetSize,
      targetColor,
      targetGeometry,
      playerPosition: { x: 0, y: 0, z: 0 },
      playerColor,
      obstacles,
      timeElapsed: 120,
    })

    // ===== 在 store 内部启动倒计时，不受 React effect 生命周期影响 =====
    if (countdownInterval) clearInterval(countdownInterval)

    countdownInterval = setInterval(() => {
      const state = get()
      if (!state.isPlaying || state.isVictory) {
        // 游戏结束或胜利：停止计时
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
        return
      }
      if (state.timeElapsed <= 1) {
        // 倒计时归零：停止
        set({ timeElapsed: 0 })
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
        return
      }
      // 正常减1
      set({ timeElapsed: state.timeElapsed - 1 })
    }, 1000)
  },

  resetGame: () => {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
    set({
      level: 1,
      score: 0,
      timeElapsed: 120,
      isPlaying: false,
      isVictory: false,
      targetPosition: { x: 5, y: 3, z: -4 },
      targetSize: [1, 1, 1],
      targetColor: '#6366f1',
      targetGeometry: 'box',
      playerPosition: { x: 0, y: 0, z: 0 },
      playerColor: '#22c55e',
      obstacles: [],
    })
  },
}))
