import { defineConfig } from 'vite';
import { resolve } from 'path';
import environment from 'vite-plugin-environment';

export default defineConfig({
  plugins: [
    environment([
      'VITE_APPWRITE_ENDPOINT',
      'VITE_APPWRITE_PROJECT_ID',
      'VITE_APPWRITE_DATABASE_ID',
      'VITE_APPWRITE_POSTS_COLLECTION_ID',
      'VITE_APPWRITE_STORAGE_BUCKET_ID'
    ], {
      prefix: 'VITE_',
      defineOn: 'import.meta.env'
    })
  ],
  
  // Base public path when served in production
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: true, // Enable source maps for debugging
    
    // Rollup configuration for multi-page setup
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true, // Automatically open browser
    strictPort: true,
    cors: true
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  },
  
  // CSS handling
  css: {
    devSourcemap: true // Sourcemaps for CSS in development
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['appwrite']
  }
});