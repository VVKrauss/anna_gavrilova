import { createClient } from '@supabase/supabase-js';

// Hardcoded конфигурация для быстрого тестирования
const SUPABASE_URL = 'https://uvcywpcikjcdyzyosvhx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Y3l3cGNpa2pjZHl6eW9zdmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTkxMzMsImV4cCI6MjA2NTQzNTEzM30.CVizF8_hNUGN_HdvcNW_jc9-G22GZkFZQAJxG4QAzF0';

// Используем переменные окружения если доступны, иначе hardcoded значения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

console.log('🔧 Инициализация Supabase клиента...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key source:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'environment' : 'hardcoded');
console.log('🔑 Key preview:', supabaseAnonKey.substring(0, 50) + '...');

// Создаем клиент с расширенными опциями
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'anna-gavrilova-portfolio',
      'apikey': supabaseAnonKey
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Детальное тестирование подключения
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Начинаем тестирование Supabase...');
    
    // Тест 1: Проверка базового подключения
    console.log('1️⃣ Тестируем базовое подключение...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('anna_ivanova_table')
      .select('section_type')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Ошибка подключения к таблице:', healthError);
      console.error('   Code:', healthError.code);
      console.error('   Message:', healthError.message);
      console.error('   Details:', healthError.details);
      console.error('   Hint:', healthError.hint);
      return false;
    }
    
    console.log('✅ Базовое подключение работает');
    console.log('📊 Данные из таблицы:', healthCheck);
    
    // Тест 2: Проверка storage
    console.log('2️⃣ Тестируем доступ к storage...');
    const { data: storageTest, error: storageError } = await supabase
      .storage
      .from('annagavrilova')
      .list('', { limit: 1 });
    
    if (storageError) {
      console.error('❌ Ошибка доступа к storage:', storageError);
      console.error('   Message:', storageError.message);
      return false;
    }
    
    console.log('✅ Storage доступен');
    console.log('📁 Содержимое storage:', storageTest);
    
    // Тест 3: Проверка папки slideshow
    console.log('3️⃣ Тестируем папку slideshow...');
    const { data: slideshowTest, error: slideshowError } = await supabase
      .storage
      .from('annagavrilova')
      .list('slideshow', { limit: 5 });
    
    if (slideshowError) {
      console.error('❌ Ошибка доступа к slideshow:', slideshowError);
      return false;
    }
    
    console.log('✅ Папка slideshow доступна');
    console.log('🖼️ Файлы в slideshow:', slideshowTest);
    
    console.log('🎉 Все тесты Supabase прошли успешно!');
    return true;
    
  } catch (error) {
    console.error('💥 Критическая ошибка при тестировании:', error);
    console.error('   Type:', typeof error);
    console.error('   Constructor:', error.constructor.name);
    if (error instanceof Error) {
      console.error('   Stack:', error.stack);
    }
    return false;
  }
};

// Автоматически тестируем при импорте (только в development)
if (import.meta.env.DEV) {
  testSupabaseConnection();
}