const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    // 直接从users集合读取总分排行榜
    // 每个用户只显示一条记录，按totalScore降序排列
    const result = await db.collection('users')
      .orderBy('totalScore', 'desc')
      .limit(10)
      .get()
    
    // 组装排行榜数据
    const rankings = result.data.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      username: user.username || '未知玩家',
      score: user.totalScore || 0,  // 返回累加后的总分
      level: user.level || 1
    }))

    return {
      code: 0,
      message: '获取排行榜成功',
      list: rankings,
      total: result.data.length
    }
  } catch (error) {
    console.error('getRanking error:', error)
    return {
      code: -1,
      message: '获取排行榜失败',
      error: error.message
    }
  }
}
