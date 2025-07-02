import { createClient } from '@supabase/supabase-js';

// Получаем переменные окружения с fallback для production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uvcywpcikjcdyzyosvhx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Y3l3cGNpa2pjZHl6eW9zdmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0NjE0NjksImV4cCI6MjAzNDAzNzQ2OX0.uOPUHf8SFsT6xm4yUZCKr1A_nBYGEU6DQMKRz-6j8tk';

// Логирование только в development
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Environment Check:');
  console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('Mode:', import.meta.env.MODE);
}

// Проверка на production
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing');
  throw new Error('Missing Supabase environment variables');
}

// Создаем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Отключаем сессии для статичного сайта
    autoRefreshToken: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'anna-gavrilova-portfolio@1.0.0'
    }
  }
});

// Экспортируем URL для прямого доступа к Storage
export const SUPABASE_URL = supabaseUrl;

// Проверка соединения только в development
if (import.meta.env.DEV) {
  supabase.from('anna_ivanova_table').select('count', { count: 'exact', head: true })
    .then(({ error, count }) => {
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
      } else {
        console.log('✅ Supabase connected successfully. Records:', count);
      }
    })
    .catch(err => {
      console.warn('⚠️ Supabase connection test failed:', err.message);
    });
}