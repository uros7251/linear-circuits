import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mathjs: ['mathjs'],
          reactflow: ['reactflow'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/solver/**/*.test.ts'],
  },
})
