import { useState, useEffect } from 'react';
import { PortfolioSection, PortfolioData } from '../types';
import { fallbackData } from '../data/fallbackData';

export const usePortfolioData = () => {
  const [data, setData] = useState<PortfolioData>(fallbackData); // Сразу устанавливаем fallback данные
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Проверяем наличие переменных окружения
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          console.log('Переменные окружения Supabase не найдены, используются статические данные');
          setData(fallbackData);
          setLoading(false);
          return;
        }

        // Динамический импорт Supabase только если переменные есть
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        console.log('Попытка подключения к Supabase...');
        
        // Пробуем загрузить данные с таймаутом
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: Supabase не отвечает')), 5000);
        });
        
        const dataPromise = supabase
          .from('anna_ivanova_table')
          .select('*')
          .order('section_order', { ascending: true });

        const { data: sections, error: supabaseError } = await Promise.race([
          dataPromise,
          timeoutPromise
        ]) as any;

        if (supabaseError) {
          console.warn('Ошибка Supabase:', supabaseError.message);
          throw new Error(`Ошибка базы данных: ${supabaseError.message}`);
        }

        if (!sections || sections.length === 0) {
          console.log('База данных пуста, используются статические данные');
          setData(fallbackData);
          setLoading(false);
          return;
        }

        // Обрабатываем данные из Supabase
        console.log('Данные из Supabase загружены успешно');
        const portfolioData: PortfolioData = {};
        
        sections.forEach((section: PortfolioSection) => {
          switch (section.section_type) {
            case 'about':
              portfolioData.about = section.content as any;
              break;
            case 'skills':
              portfolioData.skills = section.content as any;
              break;
            case 'photos':
              portfolioData.photos = (section.content as any).items || [];
              break;
            case 'videos':
              const videoContent = section.content as any;
              let videoItems = [];
              
              if (videoContent.items) {
                const flattenItems = (items: any[]): any[] => {
                  const result: any[] = [];
                  items.forEach(item => {
                    if (item.items && Array.isArray(item.items)) {
                      result.push(...flattenItems(item.items));
                    } else if (item.id && item.url) {
                      result.push(item);
                    }
                  });
                  return result;
                };
                
                videoItems = flattenItems(videoContent.items);
              }
              
              portfolioData.videos = videoItems;
              break;
            case 'audio':
              portfolioData.audio = (section.content as any).items || [];
              break;
            case 'contacts':
              portfolioData.contacts = (section.content as any).items || [];
              break;
          }
        });

        // Используем данные из Supabase, дополняя fallback данными если что-то отсутствует
        const finalData: PortfolioData = {
          about: portfolioData.about || fallbackData.about,
          skills: portfolioData.skills || fallbackData.skills,
          photos: portfolioData.photos || fallbackData.photos || [],
          videos: portfolioData.videos || fallbackData.videos || [],
          audio: portfolioData.audio || fallbackData.audio || [],
          contacts: portfolioData.contacts || fallbackData.contacts || []
        };

        setData(finalData);
        setError(null); // Очищаем ошибку при успешной загрузке
        
      } catch (err) {
        console.warn('Не удалось загрузить данные из Supabase, используются статические данные:', err);
        
        // Устанавливаем fallback данные и не показываем ошибку пользователю
        setData(fallbackData);
        setError(null); // Не показываем ошибку, так как у нас есть fallback данные
        
        // Логируем для разработчика
        console.log('Сайт работает в автономном режиме с предзагруженными данными');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};