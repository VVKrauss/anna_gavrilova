import React, { useState, useEffect } from 'react';
import { GlassCard } from '../GlassCard';
import { MediaItem } from '../../types';
import { ChevronLeft, ChevronRight, Play, Pause, ExternalLink } from 'lucide-react';

interface Video {
  id: string;
  url: string;
  name: string;
  caption?: string;
  embedUrl: string;
  platform: string;
}

interface VideosSectionProps {
  data?: MediaItem[];
}

// Функция для конвертации URL в embed URL
const convertToEmbedUrl = (url: string): { embedUrl: string; platform: string } => {
  if (!url) return { embedUrl: '', platform: 'Видео' };
  
  // VK Video
  const vkMatch = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (vkMatch) {
    const oid = vkMatch[1];
    const id = vkMatch[2];
    return {
      embedUrl: `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`,
      platform: 'VK'
    };
  }
  
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      platform: 'YouTube'
    };
  }
  
  // RuTube
  const rutubeMatch = url.match(/rutube\.ru\/video\/([^\/\?&]+)/);
  if (rutubeMatch) {
    return {
      embedUrl: `https://rutube.ru/play/embed/${rutubeMatch[1]}`,
      platform: 'RuTube'
    };
  }
  
  // Если уже embed URL
  if (url.includes('embed') || url.includes('video_ext.php')) {
    let platform = 'Видео';
    if (url.includes('vk.com')) platform = 'VK';
    if (url.includes('youtube.com')) platform = 'YouTube';
    if (url.includes('rutube.ru')) platform = 'RuTube';
    
    return { embedUrl: url, platform };
  }
  
  return { embedUrl: url, platform: 'Видео' };
};

export const VideosSection: React.FC<VideosSectionProps> = ({ data }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false); // Выключено по умолчанию для видео
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      const processedVideos: Video[] = data
        .filter(item => item && item.url && typeof item.url === 'string' && item.url.trim() !== '')
        .map((item, index) => {
          const { embedUrl, platform } = convertToEmbedUrl(item.url);
          
          return {
            id: item.id || `video-${index}`,
            url: item.url,
            name: item.title || `Видео ${index + 1}`,
            caption: item.caption,
            embedUrl,
            platform
          };
        });

      setVideos(processedVideos);
    } else {
      setVideos([]);
    }
    setLoading(false);
  }, [data]);

  // Автослайдшоу (только если включено)
  useEffect(() => {
    if (!isAutoplay || videos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 10000); // 10 секунд для видео

    return () => clearInterval(interval);
  }, [isAutoplay, videos.length]);

  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToVideo = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleAutoplay = () => {
    setIsAutoplay(!isAutoplay);
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center px-4 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
              Видеопортфолио
            </h2>
            <p className="text-slate-600 text-lg font-poiret">Загрузка видео...</p>
          </div>
          
          <GlassCard className="p-8 animate-scale-in">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-600 font-poiret">Загрузка видео...</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="min-h-screen flex items-center px-4 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
              Видеопортфолио
            </h2>
            <p className="text-slate-600 text-lg font-poiret">Видео скоро появятся</p>
          </div>
          
          <GlassCard className="p-8 animate-scale-in">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4 text-slate-500">
                <Play className="w-16 h-16" />
                <p className="font-poiret">Видео пока не загружены</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <section className="min-h-screen flex items-center px-4 py-12">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
            Видеопортфолио
          </h2>
          <p className="text-slate-600 text-lg font-poiret">Работы в эфире</p>
        </div>

        <GlassCard className="p-8 animate-scale-in">
          <div className="relative">
            {/* Основное видео */}
            <div className="relative mb-8">
              {/* Кнопка предыдущего видео */}
              <button
                onClick={prevVideo}
                disabled={videos.length <= 1}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6 text-slate-700" />
              </button>

              {/* Видео контейнер */}
              <div className="aspect-video rounded-xl overflow-hidden shadow-2xl bg-slate-100 relative">
                {currentVideo.embedUrl ? (
                  <iframe
                    src={currentVideo.embedUrl}
                    title={currentVideo.name}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200">
                    <div className="text-center text-slate-500">
                      <Play className="w-16 h-16 mx-auto mb-4" />
                      <p className="font-poiret text-lg">Видео недоступно</p>
                    </div>
                  </div>
                )}

                {/* Platform badge */}
                <div className="absolute top-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-poiret flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>{currentVideo.platform}</span>
                  </div>
                </div>
              </div>

              {/* Кнопка следующего видео */}
              <button
                onClick={nextVideo}
                disabled={videos.length <= 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6 text-slate-700" />
              </button>
            </div>

            {/* Информация о видео */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-poiret font-bold text-slate-800 mb-2">
                {currentVideo.name}
              </h3>
              {currentVideo.caption && (
                <p className="text-slate-600 font-poiret text-lg mb-4">
                  {currentVideo.caption}
                </p>
              )}
              
              {/* Ссылка на оригинал */}
              <a
                href={currentVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-poiret"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Смотреть на {currentVideo.platform}</span>
              </a>
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
                  {isAutoplay ? 'Остановить автопроигрывание' : 'Автопроигрывание'}
                </span>
              </button>

              <div className="text-sm text-slate-600 font-poiret">
                {currentIndex + 1} из {videos.length}
              </div>

              {/* Прогресс-бар автослайдшоу */}
              {isAutoplay && (
                <div className="flex-1 max-w-xs bg-white/20 backdrop-blur-sm rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      backgroundColor: '#f257cf',
                      animation: 'progress 10s linear infinite'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Точечная навигация */}
            <div className="flex justify-center space-x-2">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToVideo(index)}
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

        {/* Миниатюры видео (опционально) */}
        {videos.length > 1 && (
          <div className="mt-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => goToVideo(index)}
                  className={`group relative aspect-video rounded-lg overflow-hidden transition-all duration-300 ${
                    index === currentIndex 
                      ? 'ring-4 ring-pink-500 scale-105' 
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                >
                  <GlassCard className="w-full h-full p-0">
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center relative">
                      {/* Превью или заглушка */}
                      <div className="flex flex-col items-center text-slate-500">
                        <Play className="w-8 h-8 mb-1" />
                        <span className="text-xs font-poiret text-center px-2">
                          {video.name}
                        </span>
                      </div>
                      
                      {/* Platform badge для миниатюр */}
                      <div className="absolute top-2 right-2">
                        <div className="bg-black/70 text-white px-2 py-1 rounded text-xs font-poiret">
                          {video.platform}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </button>
              ))}
            </div>
          </div>
        )}
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