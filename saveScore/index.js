const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, username, score, level, timeElapsed } = event

  try {
    // 保存单次得分记录（用于历史查询）
    await db.collection('Scores').add({
      data: {
        userId,
        username,
        score,
        level,
        timeElapsed,
        createdAt: db.serverDate()
      }
    })

    // 累加总分到用户表
    const userResult = await db.collection('users')
      .doc(userId)
      .get()
    
    if (userResult.data) {
      // 获取当前总分（若不存在则为0）
      const currentTotalScore = userResult.data.totalScore || 0
      const newTotalScore = currentTotalScore + score
      const currentLevel = userResult.data.level || 1
      
      // 更新总分和最高等级
      const updateData = {
        totalScore: newTotalScore,
        updatedAt: db.serverDate()
      }
      
      // 如果当前等级更高，则更新
      if (level > currentLevel) {
        updateData.level = level
      }
      
      await db.collection('users').doc(userId).update({
        data: updateData
      })
      
      console.log(`[saveScore] 用户 ${username} 总分更新: ${currentTotalScore} + ${score} = ${newTotalScore}`)
    } else {
      // 用户不存在则创建记录
      await db.collection('users').doc(userId).set({
        data: {
          username,
          totalScore: score,
          level,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }

    return {
      code: 0,
      message: '保存成功',
      totalScore: (userResult.data?.totalScore || 0) + score
    }
  } catch (error) {
    console.error('saveScore error:', error)
    return {
      code: -1,
      message: '保存失败',
      error: error.message
    }
  }
}
