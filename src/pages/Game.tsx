import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Text, Line } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore, GeometryType } from '../stores/gameStore'
import { callFunction } from '../lib/cloudbase'
import { useAuthStore } from '../stores/authStore'
import GameUI from './GameUI'
import './Game.css'

// 坐标轴组件（与操控盘XYZ统一）
// X=红(水平左右), Y=绿(水平前后), Z=蓝(垂直上下)
function AxesHelper() {
  return (
    <group>
      {/* X轴：水平左右 */}
      <Line points={[[-20, 0, 0], [20, 0, 0]]} color="#ef4444" lineWidth={2} />
      <Text position={[22, 0, 0]} fontSize={0.8} color="#ef4444">X</Text>

      {/* Y轴：水平前后（沿Z方向） */}
      <Line points={[[0, 0, -20], [0, 0, 20]]} color="#22c55e" lineWidth={2} />
      <Text position={[0, 0, 22]} fontSize={0.8} color="#22c55e">Y</Text>

      {/* Z轴：垂直上下（沿Y方向） */}
      <Line points={[[0, -20, 0], [0, 20, 0]]} color="#3b82f6" lineWidth={2} />
      <Text position={[0, 22, 0]} fontSize={0.8} color="#3b82f6">Z</Text>
    </group>
  )
}

// 根据类型生成几何体组件
function GeometryMesh({ 
  type, 
  size,
  args 
}: { 
  type: GeometryType; 
  size: [number, number, number];
  args?: any[]
}) {
  switch (type) {
    case 'sphere':
      return <sphereGeometry args={[Math.max(...size) * 0.6, 32, 32]} />
    case 'cone':
      return <coneGeometry args={[Math.max(size[0], size[2]) * 0.5, size[1] * 1.2, 32]} />
    case 'cylinder':
      return <cylinderGeometry args={[Math.max(size[0], size[2]) * 0.45, Math.max(size[0], size[2]) * 0.35, size[1], 32]} />
    case 'torus':
      return <torusGeometry args={[Math.max(...size) * 0.5, Math.min(...size) * 0.25, 16, 48]} />
    case 'dodecahedron':
      return <dodecahedronGeometry args={[Math.max(...size) * 0.65]} />
    case 'octahedron':
      return <octahedronGeometry args={[Math.max(...size) * 0.7]} />
    case 'tetrahedron':
      return <tetrahedronGeometry args={[Math.max(...size) * 0.75]} />
    default:
      return <boxGeometry args={size} />
  }
}

// 目标点（线框几何体）
function TargetShape({ 
  position, 
  size, 
  color, 
  geometryType 
}: { 
  position: [number, number, number]; 
  size: [number, number, number];
  color: string;
  geometryType: GeometryType;
}) {
  return (
    <mesh position={position}>
      <GeometryMesh type={geometryType} size={size} />
      <meshBasicMaterial 
        color={color} 
        wireframe 
        transparent 
        opacity={0.85}
      />
      <lineSegments>
        {(() => {
          let geo
          const maxSize = Math.max(...size)
          switch (geometryType) {
            case 'sphere':
              geo = new THREE.SphereGeometry(maxSize * 0.6, 16, 12)
              break
            case 'cone':
              geo = new THREE.ConeGeometry(Math.max(size[0], size[2]) * 0.5, size[1] * 1.2, 8)
              break
            case 'cylinder':
              geo = new THREE.CylinderGeometry(
                Math.max(size[0], size[2]) * 0.45, 
                Math.max(size[0], size[2]) * 0.35, 
                size[1], 8
              )
              break
            case 'torus':
              geo = new THREE.TorusGeometry(maxSize * 0.5, Math.min(...size) * 0.25, 8, 24)
              break
            case 'dodecahedron':
              geo = new THREE.DodecahedronGeometry(maxSize * 0.65)
              break
            case 'octahedron':
              geo = new THREE.OctahedronGeometry(maxSize * 0.7)
              break
            case 'tetrahedron':
              geo = new THREE.TetrahedronGeometry(maxSize * 0.75)
              break
            default:
              geo = new THREE.BoxGeometry(...size)
          }
          return <edgesGeometry args={[geo]} />
        })()}
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.9} />
      </lineSegments>
    </mesh>
  )
}

// 玩家实体（实心几何体）
function PlayerShape({ 
  position, 
  size, 
  color, 
  geometryType 
}: { 
  position: [number, number, number]; 
  size: [number, number, number];
  color: string;
  geometryType: GeometryType;
}) {
  return (
    <mesh position={position} castShadow>
      <GeometryMesh type={geometryType} size={size} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.35}
        roughness={0.3}
        metalness={0.7}
      />
      <mesh>
        <GeometryMesh type={geometryType} size={[
          size[0] * 1.08, 
          size[1] * 1.08, 
          size[2] * 1.08
        ]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
    </mesh>
  )
}

// 干扰项障碍物
function Obstacle({ obstacle }: { obstacle: Obstacle & { id: string } }) {
  return (
    <mesh 
      position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
    >
      <GeometryMesh type={obstacle.geometryType} size={obstacle.size} />
      <meshStandardMaterial 
        color={obstacle.color} 
        transparent 
        opacity={0.55}
        roughness={0.5}
        metalness={0.3}
      />
    </mesh>
  )
}

// 场景组件
function Scene() {
  const targetPosition = useGameStore((state) => state.targetPosition)
  const targetSize = useGameStore((state) => state.targetSize)
  const targetColor = useGameStore((state) => state.targetColor)
  const targetGeometry = useGameStore((state) => state.targetGeometry)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const playerColor = useGameStore((state) => state.playerColor)
  const obstacles = useGameStore((state) => state.obstacles)

  return (
    <>
      {/* 灯光 */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#6366f1" />
      <pointLight 
        position={[targetPosition.x, targetPosition.y + 5, targetPosition.z]} 
        intensity={0.8} 
        color={targetColor} 
        distance={15}
      />

      {/* 网格地面（XZ平面） */}
      <Grid 
        args={[40, 40]}
        cellColor="#334155"
        sectionColor="#475569"
        fadeDistance={50}
        fadeStrength={1}
        position={[0, -0.01, 0]}
      />

      {/* 坐标轴 */}
      <AxesHelper />

      {/* 目标点 */}
      <TargetShape 
        position={[targetPosition.x, targetPosition.y, targetPosition.z]}
        size={targetSize}
        color={targetColor}
        geometryType={targetGeometry}
      />

      {/* 玩家实体 */}
      <PlayerShape 
        position={[playerPosition.x, playerPosition.y, playerPosition.z]}
        size={targetSize}
        color={playerColor}
        geometryType={targetGeometry}
      />

      {/* 干扰项 */}
      {obstacles.map((obs) => (
        <Obstacle key={obs.id} obstacle={obs} />
      ))}

      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
      />
    </>
  )
}

export default function Game() {
  const isPlaying = useGameStore((state) => state.isPlaying)
  const isVictory = useGameStore((state) => state.isVictory)
  const level = useGameStore((state) => state.level)
  const score = useGameStore((state) => state.score)
  const generateLevel = useGameStore((state) => state.generateLevel)
  const setIsVictory = useGameStore((state) => state.setIsVictory)
  const addScore = useGameStore((state) => state.addScore)
  const targetPosition = useGameStore((state) => state.targetPosition)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const timeElapsed = useGameStore((state) => state.timeElapsed)
  const { user } = useAuthStore()

  // 防止重复提交分数
  const submittedRef = useRef(false)

  useEffect(() => {
    generateLevel(1)
    return () => {}
  }, [])

  // 胜利时提交分数到排行榜（调用 saveScore 云函数）
  const submitToRanking = async (currentScore: number, currentLevel: number) => {
    if (!user || submittedRef.current) return
    submittedRef.current = true

    try {
      const result = await callFunction('saveScore', {
        userId: user.id,
        username: user.username,
        score: currentScore,
        level: currentLevel,
        timeElapsed,
      })
      console.log(`[排行榜] 分数已提交: ${currentScore}分 Lv.${currentLevel}`, result)
    } catch (err) {
      console.warn('[排行榜] 提交失败（开发模式使用本地存储）:', err)
    }
  }

  useEffect(() => {
    if (!isPlaying || isVictory) return

    const threshold = 0.6
    const dx = Math.abs(playerPosition.x - targetPosition.x)
    const dy = Math.abs(playerPosition.y - targetPosition.y)
    const dz = Math.abs(playerPosition.z - targetPosition.z)

    if (dx < threshold && dy < threshold && dz < threshold) {
      setIsVictory(true)
      const baseScore = 100
      const levelBonus = level * 50
      const timeBonus = timeElapsed * 5
      addScore(baseScore + levelBonus + timeBonus)

      // 提交总分到排行榜
      submitToRanking(score + baseScore + levelBonus + timeBonus, level)
    }
  }, [playerPosition, targetPosition, isPlaying, isVictory])

  const handleNextLevel = () => {
    submittedRef.current = false  // 重置提交标记
    generateLevel(level + 1)
  }

  return (
    <div className="game-container">
      <Canvas
        camera={{ position: [15, 12, 15], fov: 60 }}
        shadows
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <Scene />
      </Canvas>

      <GameUI onNextLevel={handleNextLevel} />
    </div>
  )
}
