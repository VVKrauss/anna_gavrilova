import React, { useState, useEffect } from 'react';
import { GlassCard } from '../GlassCard';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Play, Pause } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  name: string;
  caption: string;
}

interface PhotosSectionProps {
  data?: any[];
}

export const PhotosSection: React.FC<PhotosSectionProps> = ({ data }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoplay, setIsAutoplay] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .from('annagavrilova')
          .list('slideshow', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (bucketError) {
          console.error('Storage error:', bucketError);
          throw bucketError;
        }

        if (!bucketData || bucketData.length === 0) {
          console.log('No files found in storage');
          setPhotos([]);
          setLoading(false);
          return;
        }

        const imageFiles = bucketData.filter(file => 
          file.name && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
        );

        console.log('Found image files:', imageFiles);

        const photoItems: Photo[] = imageFiles.map((file, index) => ({
          id: `photo-${index}`,
          url: `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/slideshow/${file.name}`,
          name: file.name,
          caption: `Фото ${index + 1}`,
        }));

        console.log('Created photo items:', photoItems);
        setPhotos(photoItems);
      } catch (err) {
        console.error('Ошибка загрузки фотографий:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        // Fallback to database data if available
        if (data && data.length > 0) {
          const fallbackPhotos: Photo[] = data.map((item, index) => ({
            id: item.id || `fallback-${index}`,
            url: item.url || '',
            name: item.title || `photo-${index}`,
            caption: item.caption || `Фото ${index + 1}`,
          }));
          setPhotos(fallbackPhotos);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [data]);

  // Автослайдшоу
  useEffect(() => {
    if (!isAutoplay || photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoplay, photos.length]);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleAutoplay = () => {
    setIsAutoplay(!isAutoplay);
  };

  // Получаем индексы для отображения 3 фото
  const getVisibleIndices = () => {
    if (photos.length === 0) return [];
    if (photos.length === 1) return [0];
    if (photos.length === 2) return [0, 1];

    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    const nextIndex = (currentIndex + 1) % photos.length;
    
    return [prevIndex, currentIndex, nextIndex];
  };

  const visibleIndices = getVisibleIndices();

  if (loading) {
    return (
      <section className="min-h-screen flex items-center px-4 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
              Фотогалерея
            </h2>
            <p className="text-slate-600 text-lg font-poiret">Загрузка изображений...</p>
          </div>
          
          <GlassCard className="p-8 animate-scale-in">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-600 font-poiret">Загрузка фотографий...</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    );
  }

  if (error && photos.length === 0) {
    return (
      <section className="min-h-screen flex items-center px-4 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
              Фотогалерея
            </h2>
            <p className="text-slate-600 text-lg font-poiret">Ошибка загрузки изображений</p>
          </div>
          
          <GlassCard className="p-8 animate-scale-in">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4 text-slate-500">
                <ImageIcon className="w-16 h-16" />
                <p className="font-poiret">Не удалось загрузить фотографии</p>
                <p className="text-sm font-poiret">{error}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    return (
      <section className="min-h-screen flex items-center px-4 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
              Фотогалерея
            </h2>
            <p className="text-slate-600 text-lg font-poiret">Фотографии не найдены</p>
          </div>
          
          <GlassCard className="p-8 animate-scale-in">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4 text-slate-500">
                <ImageIcon className="w-16 h-16" />
                <p className="font-poiret">Фотографии пока не загружены</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <section className="min-h-screen flex items-center px-4 py-12">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
            Фотогалерея
          </h2>
          <p className="text-slate-600 text-lg font-poiret">Моменты из профессиональной жизни</p>
        </div>

        <GlassCard className="p-8 animate-scale-in">
          <div className="relative">
            {/* Контейнер с тремя фотографиями */}
            <div className="relative flex items-center justify-center mb-8 min-h-[500px]">
              {/* Кнопка предыдущего слайда */}
              <button
                onClick={prevPhoto}
                disabled={photos.length <= 1}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6 text-slate-700" />
              </button>

              {/* Три фотографии */}
              <div className="flex items-center justify-center space-x-6 w-full max-w-5xl">
                {visibleIndices.map((photoIndex, position) => {
                  const photo = photos[photoIndex];
                  const isCenter = position === 1;
                  const isLeft = position === 0;
                  const isRight = position === 2;

                  return (
                    <div
                      key={photoIndex}
                      className={`relative transition-all duration-700 ease-out cursor-pointer ${
                        isCenter 
                          ? 'w-full max-w-2xl z-20 scale-100' 
                          : 'w-3/5 max-w-xl z-10 scale-90'
                      } ${
                        isLeft ? '-rotate-3' : isRight ? 'rotate-3' : ''
                      }`}
                      onClick={() => !isCenter && goToPhoto(photoIndex)}
                    >
                      <div className={`min-h-[400px] max-h-[500px] rounded-xl overflow-hidden shadow-2xl transition-all duration-700 bg-slate-100 flex items-center justify-center ${
                        isCenter ? 'opacity-100' : 'opacity-40 hover:opacity-60'
                      }`}>
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="max-w-full max-h-full object-contain transition-transform duration-700 hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800';
                          }}
                        />
                      </div>
                      
                      {/* Убираем overlay с информацией */}
                    </div>
                  );
                })}
              </div>

              {/* Кнопка следующего слайда */}
              <button
                onClick={nextPhoto}
                disabled={photos.length <= 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6 text-slate-700" />
              </button>
            </div>

            {/* Управление воспроизведением */}
            <div className="flex justify-center items-center space-x-6 mb-8">
              <button
                onClick={toggleAutoplay}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 hover:bg-white/30 transition-all duration-200"
              >
                {isAutoplay ? (
                  <Pause className="w-4 h-4 text-slate-700" />
                ) : (
                  <Play className="w-4 h-4 text-slate-700" />
                )}
                <span className="text-sm font-poiret text-slate-700">
                  {isAutoplay ? 'Пауза' : 'Старт'}
                </span>
              </button>

              {/* Прогресс-бар автослайдшоу */}
              {isAutoplay && (
                <div className="flex-1 max-w-xs bg-white/20 backdrop-blur-sm rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      backgroundColor: '#f257cf',
                      animation: 'progress 5s linear infinite'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Точечная навигация */}
            <div className="flex justify-center space-x-2">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPhoto(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex 
                      ? 'w-8 h-3' 
                      : 'w-3 h-3 bg-slate-300 hover:bg-slate-400'
                  }`}
                  style={{
                    backgroundColor: index === currentIndex ? '#f257cf' : undefined
                  }}
                />
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* CSS анимация для прогресс-бара */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
};