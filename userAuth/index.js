const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 简单的密码哈希（生产环境建议使用 bcrypt 或 crypto.scrypt）
function hashPassword(password) {
  // 基础混淆哈希，防止明文存储
  let hash = 0
  const salt = '3d-game-salt-2024'
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char + (salt.charCodeAt(i % salt.length))
    hash = hash & hash
  }
  return 'hashed_' + Math.abs(hash).toString(36)
}

exports.main = async (event, context) => {
  const { action, username, password } = event

  try {
    switch (action) {
      case 'register': {
        // 检查用户是否已存在
        const existUser = await db.collection('users')
          .where({ username })
          .count()
        
        if (existUser.total > 0) {
          return { success: false, message: '用户名已存在' }
        }

        // 创建新用户（密码哈希存储）
        const result = await db.collection('users').add({
          data: {
            username,
            password: hashPassword(password), // 哈希存储，不存明文
            level: 1,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        })

        return { 
          success: true, 
          message: '注册成功',
          userId: result._id
        }
      }
      
      case 'login': {
        // 查询用户（对比哈希密码）
        const result = await db.collection('users')
          .where({ username, password: hashPassword(password) })
          .get()

        if (result.data.length === 0) {
          return { success: false, message: '用户名或密码错误' }
        }

        const user = result.data[0]
        
        return {
          success: true,
          user: {
            id: user._id,
            username: user.username,
            level: user.level || 1
          }
        }
      }
      
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('userAuth error:', error)
    return { success: false, message: '服务器错误', error: error.message }
  }
}
