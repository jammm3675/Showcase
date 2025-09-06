import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Output to a 'static' directory inside the backend folder
    outDir: path.resolve(__dirname, '../backend/static'),
    // The assetsDir should be relative to the outDir
    assetsDir: 'assets',
    // Clean the output directory before building
    emptyOutDir: true,
  },
})
