# 数据库集合设计

## 概述

本项目使用腾讯云 CloudBase 云数据库存储数据，包含以下三个主要集合：

---

## 1. Users 集合

**用途**：存储用户基本信息

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | string | 是 | 用户ID（自动生成） |
| username | string | 是 | 用户名（唯一索引） |
| password | string | 是 | 密码（建议生产环境加密） |
| level | number | 是 | 当前游戏等级，默认 1 |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |

**示例数据**：
```json
{
  "_id": "abc123",
  username: "player1",
  password: "hashed_password",
  level: 5,
  createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

**索引配置**：
```javascript
// username 唯一索引
db.collection('Users').createIndex({ username: 1 }, { unique: true })
```

---

## 2. Scores 集合

**用途**：存储玩家游戏得分记录

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | string | 是 | 记录ID（自动生成） |
| userId | string | 是 | 关联用户ID（外键） |
| score | number | 是 | 单次游戏得分 |
| level | number | 是 | 游戏结束时到达的关卡数 |
| timeElapsed | number | 是 | 游戏时长（秒） |
| createdAt | Date | 是 | 创建时间 |

**示例数据**：
```json
{
  "_id": "score001",
  "userId": "abc123",
  "score": 1250,
  "level": 8,
  "timeElapsed": 245,
  "createdAt": "2024-01-16T14:25:00Z"
}
```

**查询示例**：
```javascript
// 获取排行榜前10名（按分数降序）
const result = await db.collection('Scores')
  .orderBy('score', 'desc')
  .limit(10)
  .get()

// 获取某用户的最高分
const userBest = await db.collection('Scores')
  .where({ userId: 'abc123' })
  .orderBy('score', 'desc')
  .limit(1)
  .get()
```

---

## 3. RankingCache 集合（可选）

**用途**：缓存排行榜数据（用于优化高频访问场景）

> **注意**：当前实现采用直接查询方式（毫秒级响应），此集合为扩展预留。

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | string | 是 | 缓存ID（固定值："latest_ranking"） |
| data | array | 是 | 排行榜数据数组 |
| updatedAt | Date | 是 | 最后更新时间 |

**使用场景**：
- 当排行榜访问量极大时（如活动期间）
- 需要减少数据库读取压力时
- 配合定时触发器定期更新缓存

---

## 数据关系图

```
Users (1) ─────< (N) Scores
   │                  │
   │ userId           │ userId
   │                  │
   └──────────────────┘
         (关联)
```

---

## 安全规则

### Users 集合权限

```json
{
  "read": true,
  "write": "auth != null"
}
```

### Scores 集合权限

```json
{
  "read": true,
  "write": "auth != null && doc.userId == auth.uid"
}
```

### RankingCache 集合权限

```json
{
  "read": true,
  "write": false // 仅允许云函数写入
}
```

---

## 性能优化建议

1. **Scores 集合索引**：
   - 在 `score` 字段创建降序索引以加速排序查询
   - 在 `userId` 字段创建索引以加速用户历史查询

2. **分页支持**（扩展）：
   ```javascript
   // 分页获取排行榜
   const page = 2
   const pageSize = 10
   const skip = (page - 1) * pageSize
   
   await db.collection('Scores')
     .orderBy('score', 'desc')
     .skip(skip)
     .limit(pageSize)
     .get()
   ```

3. **数据归档**（长期运营考虑）：
   - 定期将超过30天的得分记录迁移到 `ScoresArchive` 集合
   - 保持主集合精简以提高查询速度
