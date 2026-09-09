import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1/cif-api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    emptyOutDir: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
    exclude: ['node_modules', 'dist', 'tests/e2e/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/e2e/**/*']
    }
  }
})
