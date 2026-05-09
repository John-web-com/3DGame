const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const { userId } = event

  if (!userId) {
    return { code: -1, message: '缺少 userId 参数' }
  }

  try {
    // 查询该用户的所有分数记录，按时间降序（最新在前）
    const result = await db.collection('Scores')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    return {
      code: 0,
      message: '获取成功',
      list: result.data,
      total: result.data.length
    }
  } catch (error) {
    console.error('getMyScores error:', error)
    return {
      code: -1,
      message: '获取失败',
      error: error.message
    }
  }
}
