#!/usr/bin/env node

/**
 * 3D坐标系闯关游戏 - 一键部署脚本
 * 
 * 使用方法:
 * 1. 安装依赖: npm install
 * 2. 配置环境变量: cp .env.example .env 并填入你的 CloudBase 环境ID
 * 3. 构建前端: npm run build
 * 4. 运行部署脚本: node scripts/deploy.js 或 npm run deploy:cloud
 * 
 * 前提条件:
 * - 已安装 Node.js >= 16
 * - 已安装 CloudBase CLI: npm install -g @cloudbase/cli
 * - 已登录 CloudBase: tcb login
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

function runCommand(command, description) {
  log(`\n📦 ${description}`, 'cyan')
  try {
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '..')
    })
    log(`✅ ${description}完成`, 'green')
    return output
  } catch (error) {
    log(`❌ ${description}失败`, 'red')
    log(error.message, 'red')
    process.exit(1)
  }
}

async function main() {
  log('\n========================================', 'yellow')
  log('  🎮 3D坐标系闯关游戏 - 自动化部署脚本', 'yellow')
  log('========================================\n', 'yellow')

  // 步骤 1: 检查环境
  log('步骤 1/5: 检查环境...', 'yellow')
  
  // 检查 Node.js 版本
  const nodeVersion = execSync('node --version').toString().trim()
  log(`Node.js 版本: ${nodeVersion}`, 'cyan')

  // 检查 CloudBase CLI
  try {
    const tcbVersion = execSync('tcb --version').toString().trim()
    log(`CloudBase CLI 版本: ${tcbVersion}`, 'cyan')
  } catch {
    log('未安装 CloudBase CLI，正在安装...', 'yellow')
    runCommand('npm install -g @cloudbase/cli', '安装 CloudBase CLI')
  }

  // 步骤 2: 构建前端
  log('\n步骤 2/5: 构建前端资源...', 'yellow')
  
  if (!fs.existsSync(path.resolve(__dirname, '..', 'node_modules'))) {
    runCommand('npm install', '安装项目依赖')
  }
  
  runCommand('npm run build', '构建 Vite 前端项目')

  if (!fs.existsSync(path.resolve(__dirname, '..', 'dist'))) {
    log('构建产物不存在！请检查构建过程', 'red')
    process.exit(1)
  }

  // 步骤 3: 部署云函数
  log('\n步骤 3/5: 部署云函数...', 'yellow')
  
  const functions = ['userAuth', 'getRanking', 'saveScore']
  
  for (const funcName of functions) {
    const funcPath = path.join(__dirname, '..', 'cloudfunctions', funcName)
    
    if (!fs.existsSync(funcPath)) {
      log(`云函数 ${funcName} 目录不存在，跳过部署`, 'yellow')
      continue
    }

    // 安装函数依赖
    const packageJsonPath = path.join(funcPath, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      runCommand(
        `cd "${funcPath}" && npm install --production`,
        `安装 ${funcName} 函数依赖`
      )
    }

    // 部署单个云函数（新版CLI自动从cloudbaserc.json读取envId）
    runCommand(
      `tcb fn deploy ${funcName} --force`,
      `部署云函数: ${funcName}`
    )
  }

  // 步骤 4: 部署静态网站
  log('\n步骤 4/5: 部署静态网站到 CloudBase 托管...', 'yellow')
  
  runCommand(
    `tcb hosting deploy ./dist /3d-game -e ${process.env.CLOUDBASE_ENV || 'seven-website-8gwpkoon2ce77ee5'}`,
    '上传静态资源到云托管'
  )

  // 步骤 5: 完成信息
  log('\n步骤 5/5: 部署完成！', 'green')
  log('\n========================================', 'green')
  log('  ✅ 部署成功！', 'green')
  log('========================================\n', 'green')
  
  log('📋 部署信息:', 'cyan')
  log(`  • 环境ID: ${process.env.CLOUDBASE_ENV || 'your-env-id'}`)
  log('  • 静态网站路径: /3d-game')
  log('  • 云函数数量: 3个')
  log('')
  log('🔗 访问地址:', 'cyan')
  log(`  https://${process.env.CLOUDBASE_ENV || 'your-env-id'}.tcb.qcloud.la/3d-game`)
  log('')
  log('⚠️ 后续操作:', 'yellow')
  log('  1. 登录腾讯云控制台 → CloudBase → 数据库')
  log('  2. 创建以下集合并设置安全规则:')
  log('     - Users（用户表）')
  log('     - Scores（分数表）')
  log('     - RankingCache（排行榜缓存，可选）')
  log('')
}

main().catch((error) => {
  log(`部署过程出错: ${error.message}`, 'red')
  process.exit(1)
})
