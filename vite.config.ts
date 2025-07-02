import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  
  // Корневая директория
  root: '.',
  
  // Базовый путь
  base: '/',
  
  // Настройки сборки
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    
    // Отключаем sourcemap для продакшена
    sourcemap: false,
    
    // Размер чанка
    chunkSizeWarningLimit: 1000,
    
    // Настройки Rollup
    rollupOptions: {
      output: {
        // Разделение кода для лучшего кэширования
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui-vendor': ['lucide-react']
        },
        
        // Именование файлов для кэширования
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          if (/\.(css)$/.test(assetInfo.name || '')) {
            return `assets/css/[name].[hash].${ext}`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico|avif)$/.test(assetInfo.name || '')) {
            return `assets/images/[name].[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
            return `assets/fonts/[name].[hash].${ext}`;
          }
          
          return `assets/[name].[hash].${ext}`;
        },
        
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js'
      }
    },
    
    // Настройки минификации
    minify: 'terser',
    terserOptions: {
      compress: {
        // Удаляем console.log в продакшене
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // CSS настройки
    cssCodeSplit: true,
    
    // Инлайн небольших ассетов
    assetsInlineLimit: 4096,
    
    // Целевая платформа
    target: 'esnext'
  },
  
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ]
  },
  
  // Настройки для dev сервера
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    cors: true
  },
  
  // Настройки для preview
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    cors: true
  },
  
  // Алиасы путей
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@types': resolve(__dirname, 'src/types'),
      '@lib': resolve(__dirname, 'src/lib')
    }
  },
  
  // Переменные окружения
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
});