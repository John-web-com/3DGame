import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: '/3d-game/',
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    },
    // 显式定义环境变量
    define: {
      'import.meta.env.VITE_CLOUDBASE_ENV': JSON.stringify(env.VITE_CLOUDBASE_ENV || 'seven-website-8gwpkoon2ce77ee5')
    }
  }
})
