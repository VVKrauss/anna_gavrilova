import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Базовая конфигурация React
      include: "**/*.{jsx,tsx}",
      // Отключаем babel плагины, которые могут вызывать проблемы
      babel: {
        // Оставляем базовую конфигурацию без дополнительных плагинов
        babelrc: false,
        configFile: false
      }
    })
  ],
  
  // Корневая директория
  root: '.',
  
  // Базовый путь (важно для CDN и субдоменов)
  base: '/',
  
  // Настройки сборки
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    
    // Отключаем sourcemap для продакшена (экономим место)
    sourcemap: false,
    
    // Минимальный размер чанка (в байтах)
    chunkSizeWarningLimit: 1000,
    
    // Настройки Rollup
    rollupOptions: {
      // Исключаем определенные зависимости из бандла
      external: [],
      
      output: {
        // Разделение кода для лучшего кэширования
        manualChunks: {
          // Основные библиотеки React
          'react-vendor': ['react', 'react-dom'],
          
          // Supabase клиент
          'supabase': ['@supabase/supabase-js'],
          
          // UI библиотеки
          'ui-vendor': ['lucide-react']
        },
        
        // Именование файлов для кэширования
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          // Категоризируем ассеты
          if (/\.(css)$/.test(assetInfo.name || '')) {
            return `assets/css/[name].[hash].${ext}`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico|avif)$/.test(assetInfo.name || '')) {
            return `assets/images/[name].[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
            return `assets/fonts/[name].[hash].${ext}`;
          }
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name || '')) {
            return `assets/media/[name].[hash].${ext}`;
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
        drop_debugger: true,
        
        // Дополнительные оптимизации
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        
        // Оптимизируем условия
        passes: 2
      },
      mangle: {
        // Сохраняем имена классов для CSS
        keep_classnames: false,
        keep_fnames: false
      },
      format: {
        // Удаляем комментарии
        comments: false
      }
    },
    
    // Включаем оптимизацию CSS
    cssCodeSplit: true,
    cssMinify: true,
    
    // Оптимизация ассетов
    assetsInlineLimit: 4096, // 4KB - инлайним мелкие файлы
    
    // Включаем tree shaking
    target: 'esnext'
  },
  
  // Настройки оптимизации зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ],
    exclude: []
  },
  
  // CSS настройки
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      // Если используете Sass/SCSS
      scss: {
        additionalData: `$env: ${process.env.NODE_ENV};`
      }
    }
  },
  
  // Настройки для dev сервера
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    
    // Настройки для разработки
    cors: true,
    
    // Прокси настройки (если нужны)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3001',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '')
    //   }
    // }
  },
  
  // Настройки для preview
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    cors: true
  },
  
  // Настройки алиасов (если нужны)
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
    // Глобальные константы для продакшена
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Экспериментальные функции
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    }
  }
});