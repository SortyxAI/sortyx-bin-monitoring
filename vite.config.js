import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 5173,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'firebase/app',
      'firebase/auth',
      'firebase/database',
      'firebase/firestore',
      'lucide-react',
      'recharts',
    ],
    exclude: [
      '@radix-ui/react-navigation-menu',
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
    force: true, // Force re-optimization
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})