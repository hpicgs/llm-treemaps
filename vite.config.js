import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["treemap"],
  },
  build: {
    commonjsOptions: {
      include: [/treemap/, /node_modules/],
    },
  },
})
