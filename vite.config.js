import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries
          'ui-vendor': ['framer-motion', 'lucide-react', 'sonner'],
          
          // Admin dashboard (heavy component)
          'admin': [
            './src/pages/Admindashboard.jsx',
            './src/components/admin/StatCard.jsx',
            './src/components/admin/TodaySales.jsx',
            './src/components/admin/PerfumeRow.jsx',
            './src/components/admin/CategoryRow.jsx',
            './src/components/admin/PerfumeSalesSection.jsx',
            './src/components/admin/CategoriesSection.jsx',
            './src/components/admin/TopProductsTable.jsx',
            './src/components/admin/PerfumesInventory.jsx',
          ],
          
          // Inventory components
          'inventory': [
            './src/pages/Inventory.jsx',
            './src/components/inventory/DuplicateProductModal.jsx',
            './src/components/inventory/AddProductForm.jsx',
            './src/components/inventory/ImportCSVForm.jsx',
            './src/components/inventory/SearchBar.jsx',
            './src/components/inventory/ProductsTable.jsx',
          ],
          
          // Caja components
          'caja': [
            './src/pages/Caja.jsx',
            './src/components/caja/IdleScreen.jsx',
            './src/components/caja/QuickAddPad.jsx',
            './src/components/caja/ProductScanner.jsx',
            './src/components/caja/TempProductForm.jsx',
            './src/components/caja/CartSidebar.jsx',
            './src/components/caja/TicketModal.jsx',
          ],
          
          // Barcode scanner library (if large)
          'scanner': ['html5-qrcode'],
        },
      },
    },
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
  
  // Optimization for development
  server: {
    port: 5173,
    open: true,
  },
})