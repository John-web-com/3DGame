// CloudBase SDK 配置 - 使用动态import确保Vite/浏览器兼容
let sdkInstance: any = null
let auth: any = null
let db: any = null
/** 是否为真实云端模式（false=本地开发mock模式） */
export let isCloudMode = false

// 本地排行榜（仅mock模式下使用）
const localRankings: Array<{userId:string, username:string, score:number, level:number}> = []

// 开发模式下使用模拟实现
const mockFunctions = {
  callFunction: async (name: string, data: any) => {
    console.log(`[Mock] 调用云函数 ${name}:`, data)

    // 模拟 userAuth
    if (name === 'userAuth') {
      const { action, username } = data
      if (action === 'login' || action === 'register') {
        return {
          result: {
            user: {
              id: 'mock-user-' + Date.now(),
              username: username || 'Player',
              level: 1
            }
          }
        }
      }
    }

    // 模拟 getRanking：返回本地排行榜数据
    if (name === 'getRanking') {
      const sorted = [...localRankings].sort((a, b) => b.score - a.score)
      return { result: { list: sorted } }
    }

    // 模拟 saveScore
    if (name === 'saveScore' || name === 'submitScore') {
      const { userId, username, score, level } = data
      const existingIdx = localRankings.findIndex(r => r.userId === userId)
      if (existingIdx >= 0) {
        if (score > localRankings[existingIdx].score) {
          localRankings[existingIdx] = { userId, username, score, level }
        }
      } else {
        localRankings.push({ userId, username, score, level })
      }
      console.log(`[Mock] 分数已提交: ${username} ${score}分 Lv.${level}`)
      return { result: { success: true } }
    }

    // 模拟 getMyScores
    if (name === 'getMyScores') {
      const myScores = localRankings.filter(r => r.userId === data.userId)
      return { result: { list: myScores, total: myScores.length } }
    }

    return { result: {} }
  }
}

const mockDb = {
  collection: () => ({
    where: () => ({ get: async () => ({ data: [] }), count: async () => ({ total: 0 }) }),
    add: async () => ({}),
    orderBy: () => ({ limit: () => ({ get: async () => ({ data: [] }) }) }),
    doc: () => ({ get: async () => ({ data: null }), update: async () => ({}) })
  })
}

// 初始化 CloudBase SDK（动态import，兼容Vite浏览器环境）
let sdkReady: Promise<void>

async function initSDK() {
  try {
    const cloudbase = await import('@cloudbase/js-sdk')
    const SDK = cloudbase.default ? cloudbase.default : cloudbase
    
    // SDK 2.x 初始化
    sdkInstance = SDK.init({
      env: import.meta.env.VITE_CLOUDBASE_ENV || 'seven-website-8gwpkoon2ce77ee5'
    })

    // 验证SDK实例可用性
    if (typeof sdkInstance?.callFunction !== 'function') {
      throw new Error('SDK callFunction 方法不可用')
    }

    // SDK 2.x: auth 可能是函数或对象，需要兼容处理
    if (typeof sdkInstance.auth === 'function') {
      auth = sdkInstance.auth()
    } else if (sdkInstance.auth) {
      auth = sdkInstance.auth
    } else {
      auth = null
    }
    
    db = sdkInstance.database || null
    
    console.log('[CloudBase] SDK实例初始化成功')
    console.log('[CloudBase] auth类型:', typeof auth, 'auth对象:', auth)
    
    // 检查匿名登录方法是否存在
    if (auth) {
      console.log('[CloudBase] signInAnonymously方法类型:', typeof auth.signInAnonymously)
      console.log('[CloudBase] signInAnonymous方法类型:', typeof auth.signInAnonymous)
    }

    // 关键：必须先进行身份认证，否则调用云函数会报 PERMISSION_DENIED
    let authSuccess = false

    // 方式1: 匿名登录 - 兼容不同SDK版本的方法名
    if (auth) {
      // 尝试多种可能的方法名
      const signInMethod = auth.signInAnonymously || auth.signInAnonymous || auth.signInAnonymously
      if (typeof signInMethod === 'function') {
        try {
          const loginResult = await signInMethod.call(auth)
          console.log('[CloudBase] ✅ 匿名登录成功:', loginResult?.user?.uid || 'uid未知')
          authSuccess = true
        } catch (loginErr: any) {
          console.warn('[CloudBase] ⚠️ 匿名登录失败:', loginErr?.message || loginErr)
        }
      } else {
        console.warn('[CloudBase] ⚠️ 找不到匿名登录方法，可用方法:', Object.getOwnPropertyNames(auth).join(', '))
      }
    }

    // 方式2: 尝试获取已有登录状态
    if (!authSuccess && auth && typeof auth.getLoginState === 'function') {
      try {
        const state = await auth.getLoginState()
        if (state) {
          console.log('[CloudBase] ✅ 已有登录状态:', state.uid)
          authSuccess = true
        }
      } catch (e) { /* ignore */ }
    }

    if (!authSuccess) {
      console.warn('[CloudBase] ⚠️ 未完成认证，云函数调用可能被拒绝')
      console.warn('[CloudBase] 请在CloudBase控制台开启"匿名登录"：环境设置 → 登录授权 → 匿名登录')
    } else {
      console.log('[CloudBase] ✅ 认证完成，可以正常调用云函数')
    }

    isCloudMode = true
    console.log('[CloudBase] 云端模式已启用, 环境ID:', import.meta.env.VITE_CLOUDBASE_ENV || 'seven-website-8gwpkoon2ce77ee5')
  } catch (e: any) {
    console.warn('[CloudBase] SDK 加载失败，使用开发模式（数据仅本地，跨终端不可见）:', e?.message || e)
    isCloudMode = false
  }
}

sdkReady = initSDK()

/**
 * 调用云函数（统一入口）
 * 云端模式: instance.callFunction({ name, data })
 * 本地模式: mockFunctions.callFunction(name, data)
 */
export async function callFunction(name: string, data: any): Promise<any> {
  await sdkReady

  if (isCloudMode && sdkInstance) {
    // CloudBase Web SDK: 直接在实例上调用 callFunction
    try {
      return await sdkInstance.callFunction({ name, data })
    } catch (err: any) {
      console.warn(`[CloudBase] 云函数 ${name} 调用失败:`, err?.message || err)
      throw err
    }
  }

  // 回退到 Mock 模式
  return mockFunctions.callFunction(name, data)
}

export { auth, db }
export default null as any
