import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import compression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/knooppuntenanalyse/' : '/',
  plugins: [react(),     
  compression({
    algorithm: 'gzip',  // or 'brotliCompress', 'deflate', etc.
    ext: '.gz',         // extension to add to compressed files
    filter: /\.(js|mjs|json|css|html)$/i,  // files to compress
    threshold: 1024,    // minimum size to compress (in bytes)
    deleteOriginFile: false,  // keep original files
    verbose: true,      // log compression stats
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'recharts-vendor': ['recharts'],
          'reagraph-vendor': ['reagraph'],
          // Group shadcn components together
          'shadcn': [
            '@/components/ui/button',
            '@/components/ui/card',
            '@/components/ui/drawer',
            '@/components/ui/slider'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
})