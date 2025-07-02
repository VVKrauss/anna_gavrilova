import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Plugin для копирования .htaccess
const copyHtaccessPlugin = () => {
  return {
    name: 'copy-htaccess',
    writeBundle() {
      const htaccessPath = resolve('.htaccess');
      const distHtaccessPath = resolve('dist', '.htaccess');
      
      if (existsSync(htaccessPath)) {
        try {
          copyFileSync(htaccessPath, distHtaccessPath);
          console.log('✅ .htaccess copied to dist/');
        } catch (error) {
          console.warn('⚠️ Failed to copy .htaccess:', error.message);
        }
      } else {
        console.warn('⚠️ .htaccess not found in project root');
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyHtaccessPlugin()
  ],
  root: '.',
  base: '/', // Важно для правильных путей
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false, // Отключаем sourcemap для продакшена
    rollupOptions: {
      output: {
        manualChunks: {
          // Разделяем код для лучшей загрузки
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react']
        },
        // Стабильные имена файлов для кэширования
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Минификация для продакшена
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Убираем console.log в продакшене
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Настройки для dev сервера
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false
  },
  // Настройки для preview
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false
  }
});