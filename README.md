# 🎮 3D坐标系闯关游戏

一个基于 **React + Three.js** 的3D空间闯关小游戏，支持 **PC/移动端多端适配**，采用 **腾讯云 CloudBase Serverless 架构** 部署。

![架构](docs/architecture.png)

## ✨ 项目特点

- 🎯 **3D坐标系挑战**: 在三维空间中操控立方体到达目标位置
- 📱 **多端适配**: PC键盘控制 + 移动端虚拟摇杆
- ☁️ **三层架构**: 表现层（前端）→ 服务层（云函数）→ 数据层（云数据库）
- ⚡ **毫秒级排行榜**: 利用数据库原生查询性能，实时更新排名
- 🚀 **一键部署**: 通过 CloudBase CLI 自动化部署到云端

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    表现层 (前端)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │ 登录注册 │  │ 游戏大厅 │  │ 3D场景  │  │ 排行榜 │ │
│  └─────────┘  └─────────┘  └─────────┘  └────────┘ │
├─────────────────────────────────────────────────────┤
│                    服务层 (云函数)                    │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐         │
│  │ userAuth │  │ getRanking│  │ saveScore │         │
│  └──────────┘  └───────────┘  └──────────┘         │
├─────────────────────────────────────────────────────┤
│                    数据层 (云数据库)                  │
│  ┌───────┐  ┌────────┐  ┌─────────────┐           │
│  │ Users │  │ Scores │  │ RankingCache│           │
│  └───────┘  └────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ 技术栈

### 前端 (表现层)
| 技术 | 用途 |
|------|------|
| **React 18** | UI框架 |
| **TypeScript** | 类型安全 |
| **Three.js** | 3D渲染引擎 |
| **@react-three/fiber** | React Three.js 绑定 |
| **@react-three/drei** | Three.js 辅助工具集 |
| **Zustand** | 轻量状态管理 |
| **Vite** | 构建工具 |

### 后端 (服务层)
| 技术 | 用途 |
|------|------|
| **腾讯云 CloudBase** | Serverless 云函数平台 |
| **wx-server-sdk** | Node.js SDK |

### 基础设施
| 服务 | 说明 |
|------|------|
| **CloudBase 托管** | 静态网站托管 (CDN加速) |
| **CloudBase 数据库** | MongoDB 兼容文档数据库 |
| **CloudBase CLI** | 一键部署工具 |

---

## 📦 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 腾讯云账号（开通 CloudBase 服务）

### 本地开发

```bash
# 1. 克隆项目
git clone <repository-url>
cd 3d-coordinate-game

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 CloudBase 环境ID

# 4. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 即可开始游戏！

---

## 🎮 游戏玩法

### 操作说明

#### PC端
| 按键 | 功能 |
|------|------|
| `W` / `↑` | 向前移动（Z轴负方向） |
| `S` / `↓` | 向后移动（Z轴正方向） |
| `A` / `←` | 向左移动（X轴负方向） |
| `D` / `→` | 向右移动（X轴正方向） |
| `Q` | 向上移动（Y轴正方向） |
| `E` | 向下移动（Y轴负方向） |
| 鼠标拖拽 | 旋转视角 |
| 滚轮 | 缩放视角 |

#### 移动端
- 使用屏幕右下角的 **虚拟摇杆** 控制移动
- 切换 **X/Y轴** 和 **Z轴** 模式实现三维移动
- 单指拖拽旋转视角，双指缩放

### 游戏目标

1. 观察 **紫色线框立方体** 的位置（目标点）
2. 操控 **绿色实心立方体**（玩家实体）
3. 将玩家移动到目标位置重合
4. 成功后自动进入下一关，难度递增

### 得分规则

- **基础分**: 100 分/关
- **等级加成**: 当前关卡数 × 50
- **时间奖励**: max(0, 300 - 用时秒数) × 2

---

## 📂 项目结构

```
3d-coordinate-game/
├── cloudfunctions/          # 云函数代码
│   ├── userAuth/           # 用户鉴权（登录/注册）
│   │   ├── index.js
│   │   ├── package.json
│   │   └── config.json
│   ├── getRanking/         # 排行榜查询
│   │   ├── index.js
│   │   ├── package.json
│   │   └── config.json
│   └── saveScore/          # 保存得分
│       ├── index.js
│       ├── package.json
│       └── config.json
├── docs/
│   └── database-design.md  # 数据库设计文档
├── scripts/
│   └── deploy.js           # 自动化部署脚本
├── src/
│   ├── components/         # React 组件
│   │   ├── VirtualJoystick.tsx   # 移动端虚拟摇杆
│   │   └── VirtualJoystick.css
│   ├── lib/
│   │   └── cloudbase.ts    # CloudBase SDK 配置
│   ├── pages/              # 页面组件
│   │   ├── Game.tsx        # 游戏主页面（3D场景）
│   │   ├── Game.css
│   │   ├── GameUI.tsx      # 游戏UI界面
│   │   ├── Login.tsx       # 登录注册页
│   │   ├── Login.css
│   │   ├── Lobby.tsx       # 大厅/罗盘页
│   │   ├── Lobby.css
│   │   ├── Ranking.tsx     # 排行榜页
│   │   ├── Ranking.css
│   │   ├── Profile.tsx     # 个人信息页
│   │   └── Profile.css
│   ├── stores/             # Zustand 状态管理
│   │   ├── authStore.ts    # 用户认证状态
│   │   └── gameStore.ts    # 游戏状态
│   ├── styles/
│   │   └── global.css      # 全局样式
│   ├── App.tsx             # 应用根组件（路由配置）
│   └── main.tsx            # 应用入口
├── index.html              # HTML 入口
├── package.json
├── tsconfig.json
├── vite.config.ts
├── cloudbaserc.json        # CloudBase 配置文件
├── .env.example            # 环境变量模板
└── README.md               # 项目文档
```

---

## ☁️ 部署到云端

### 方法一：使用部署脚本（推荐）

```bash
# 1. 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 2. 登录腾讯云
tcb login

# 3. 运行部署脚本
npm run deploy:cloud
```

部署脚本会自动完成：
1. ✅ 构建前端项目（`npm run build`）
2. ✅ 部署3个云函数（userAuth、getRanking、saveScore）
3. ✅ 上传静态资源到 CloudBase 托管

### 方法二：手动部署

#### 步骤 1: 创建 CloudBase 环境

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/tcb)
2. 创建新的 CloudBase 环境（选择「按量计费」套餐）
3. 记录环境ID（格式如：`env-xxxxxx`）

#### 步骤 2: 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```bash
VITE_CLOUDBASE_ENV=your-env-id
```

#### 步骤 3: 构建前端

```bash
npm install
npm run build
```

#### 步骤 4: 部署云函数

```bash
# 部署用户鉴权函数
tcb fn deploy userAuth --env your-env-id

# 部署排行榜函数
tcb fn deploy getRanking --env your-env-id

# 部署保存分数函数
tcb fn deploy saveScore --env your-env-id
```

#### 步骤 5: 部署静态网站

```bash
tcb hosting deploy ./dist /3d-game -e your-env-id
```

访问地址：`https://your-env-id.tcb.qcloud.la/3d-game`

---

## 🔧 数据库配置

部署完成后，需要在 CloudBase 控制台手动创建集合：

### 创建集合格式

在 [CloudBase 数据库控制台](https://console.cloud.tencent.com/tcb/env/database)：

1. 点击「新建集合」，依次创建以下三个集合：

| 集合名 | 权限设置 |
|--------|----------|
| `Users` | 所有用户可读，仅创建者可写 |
| `Scores` | 所有用户可读，仅创建者可写 |
| `RankingCache` | 所有用户可读，管理员可写（可选）|

2. （可选）为 `Users.username` 字段添加唯一索引，确保用户名不重复

### 详细设计文档

参见 [`docs/database-design.md`](./docs/database-design.md)

---

## 🎮 核心功能详解

### 1. 用户系统

- **注册**: 用户输入用户名和密码 → 调用 `userAuth` 云函数 → 写入 Users 集合
- **登录**: 验证凭据 → 返回用户信息 → 存入 Zustand 全局状态

### 2. 游戏引擎

- **Three.js 场景**: 使用 @react-three/fiber 实现声明式3D渲染
- **坐标系统**: 显示 XYZ 三轴彩色坐标线 + 网格地面
- **关卡生成**: 
  - 目标位置随机生成（范围随关卡增加）
  - 干扰项数量递增（最多12个障碍物）
  - 目标形状（长宽高）每次不同

### 3. 排行榜算法

```
getRanking 云函数执行流程:
1. 接收前端请求
2. 查询 Scores 集合:
   - ORDER BY score DESC
   - LIMIT 10
3. 关联查询 Users 集合获取用户名
4. 返回前10名数据（耗时 < 50ms）
```

**优势对比定时器方案**:
- ❌ 定时触发器：需要维护缓存一致性、延迟高（分钟级）、资源浪费
- ✅ 直接查询方案：毫级响应、数据实时、零运维成本

### 4. 多端适配策略

```typescript
// 设备检测
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

// 条件渲染
{isMobile ? <VirtualJoystick /> : <KeyboardControls />}
```

---

## 🐛 故障排查

### 常见问题

**Q: 云函数调用失败？**
- 检查 `.env` 中的 `VITE_CLOUDBASE_ENV` 是否正确
- 确认 CloudBase 控制台中已创建对应集合
- 查看云函数日志定位错误

**Q: 3D场景黑屏？**
- 确认浏览器支持 WebGL（Chrome/Firefox/Safari 最新版）
- 检查 GPU 驱动是否为最新版本
- 开发模式运行 `vite` 查看控制台报错

**Q: 移动端摇杆无响应？**
- 确保通过 HTTPS 或 localhost 访问（触摸事件限制）
- iOS Safari 可能需要添加 `touch-action: none` CSS 属性

---

## 📄 License

MIT License © 2024

---

## 👥 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📞 技术支持

- **文档**: [腾讯云 CloudBase 官方文档](https://docs.cloudbase.net/)
- **问题反馈**: 在 GitHub Issues 中提交
- **社区交流**: 加入微信技术群讨论

---

<p align="center">
  Made with ❤️ using React + Three.js + CloudBase
</p>
