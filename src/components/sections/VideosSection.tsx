import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../GlassCard';
import { MediaItem } from '../../types';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, ExternalLink, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Video {
  id: string;
  url: string;
  name: string;
  caption?: string;
  isVertical?: boolean;
  type: 'storage' | 'embedded' | 'external';
  platform?: string;
  loaded?: boolean;
  loading?: boolean;
  thumbnail?: string;
}

interface VideosSectionProps {
  data?: MediaItem[];
}

// Function to convert VK video URL to embed URL
const convertVKVideoUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const vkVideoMatch = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (vkVideoMatch) {
    const oid = vkVideoMatch[1];
    const id = vkVideoMatch[2];
    return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`;
  }
  
  if (url.includes('video_ext.php')) {
    return url;
  }
  
  return url;
};

// Function to get platform name from URL
const getPlatformName = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return 'Видео';
  }
  
  if (url.includes('vk.com')) return 'VK';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('rutube.ru')) return 'RuTube';
  return 'Видео';
};

// Function to check if URL is external embedded video
const isExternalVideo = (url: string): boolean => {
  if (!url) return false;
  return url.includes('vk.com') || 
         url.includes('youtube.com') || 
         url.includes('youtu.be') || 
         url.includes('rutube.ru') ||
         url.includes('video_ext.php');
};

export const VideosSection: React.FC<VideosSectionProps> = ({ data }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: string]: boolean }>({});
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const [duration, setDuration] = useState<{ [key: string]: number }>({});
  const [loadingStorageVideos, setLoadingStorageVideos] = useState(false);
  
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const searchAbortController = useRef<AbortController | null>(null);

  // Функция для проверки существования видеофайла
  const checkVideoExists = async (fileName: string): Promise<boolean> => {
    try {
      const testUrl = `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/${encodeURIComponent(fileName)}`;
      
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: searchAbortController.current?.signal,
        cache: 'no-cache'
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Умный поиск с остановкой при первой пропущенной последовательности
  const findStorageVideos = async (): Promise<Video[]> => {
    const foundVideos: Video[] = [];
    const extensions = ['mp4', 'mov', 'avi', 'webm', 'ogg', 'mkv'];
    
    console.log('🔍 Smart searching for storage videos...');
    
    // Проверяем последовательно от 1 до 50
    for (let i = 1; i <= 50; i++) {
      if (searchAbortController.current?.signal.aborted) break;
      
      let foundAnyForNumber = false;
      const numberStr = i.toString().padStart(2, '0');
      
      // Проверяем все расширения для текущего номера
      for (const ext of extensions) {
        const fileName = `video_${numberStr}.${ext}`;
        
        if (await checkVideoExists(fileName)) {
          const video: Video = {
            id: `storage-video-${foundVideos.length}`,
            url: `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/${encodeURIComponent(fileName)}`,
            name: `video_${numberStr}`,
            type: 'storage',
            loaded: false,
            loading: false
          };
          
          foundVideos.push(video);
          foundAnyForNumber = true;
          console.log(`✅ Found: ${fileName}`);
          break; // Нашли файл для этого номера, переходим к следующему
        }
      }
      
      // Если не нашли файл для текущего номера, останавливаем поиск
      if (!foundAnyForNumber) {
        console.log(`❌ No video found for number ${numberStr}, stopping search`);
        break;
      }
      
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return foundVideos;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        let allVideos: Video[] = [];
        
        // 1. СНАЧАЛА загружаем видео из базы данных (мгновенно)
        if (data && Array.isArray(data)) {
          const validDatabaseVideos = data.filter(video => 
            video && video.url && typeof video.url === 'string' && video.url.trim() !== ''
          );

          const databaseVideos: Video[] = validDatabaseVideos.map((video, index) => {
            const isExternal = isExternalVideo(video.url);
            
            return {
              id: video.id || `db-video-${index}`,
              url: video.url,
              name: video.title || 'Без названия',
              caption: video.caption,
              type: isExternal ? 'external' : 'embedded',
              platform: isExternal ? getPlatformName(video.url) : undefined,
              loaded: true // БД видео сразу готовы к показу
            };
          });

          allVideos = [...databaseVideos];
          console.log(`✅ Loaded ${databaseVideos.length} database videos instantly`);
        }

        // Показываем видео из БД сразу
        setVideos(allVideos);
        setLoading(false);
        
        // 2. ЗАТЕМ ищем видео в Storage в фоне
        setLoadingStorageVideos(true);
        searchAbortController.current = new AbortController();
        
        try {
          // Сначала пробуем API (быстро)
          const { data: bucketData, error: bucketError } = await supabase
            .storage
            .from('annagavrilova')
            .list('video', {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });

          let storageVideos: Video[] = [];

          if (!bucketError && bucketData && bucketData.length > 0) {
            const videoFiles = bucketData.filter(file => {
              return file.name && 
                     file.name !== '.emptyFolderPlaceholder' && 
                     /\.(mp4|mov|avi|webm|ogg|mkv)$/i.test(file.name);
            });

            if (videoFiles.length > 0) {
              storageVideos = videoFiles.map((file, index) => ({
                id: `api-storage-video-${index}`,
                url: `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/${encodeURIComponent(file.name)}`,
                name: file.name.replace(/\.[^/.]+$/, ''),
                type: 'storage',
                loaded: false,
                loading: false
              }));
              
              console.log(`✅ Found ${storageVideos.length} videos via API`);
            }
          } else {
            // Если API не сработал, используем умный поиск
            console.log('🔄 API failed, using smart search...');
            storageVideos = await findStorageVideos();
          }

          // Добавляем найденные Storage видео
          if (storageVideos.length > 0) {
            storageVideos.sort((a, b) => a.name.localeCompare(b.name));
            setVideos(prev => [...prev, ...storageVideos]);
            console.log(`🎉 Added ${storageVideos.length} storage videos as placeholders`);
          }
          
        } catch (storageErr) {
          console.error('💥 Storage search error:', storageErr);
        } finally {
          setLoadingStorageVideos(false);
        }

      } catch (err) {
        console.error('Ошибка загрузки видео:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        setLoading(false);
      }
    };

    fetchVideos();

    // Cleanup
    return () => {
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
    };
  }, [data]);

  // Функция для ленивой загрузки видео при клике
  const loadVideo = async (videoId: string) => {
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, loading: true } : v
    ));

    // Имитируем небольшую задержку для UX
    await new Promise(resolve => setTimeout(resolve, 500));

    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, loaded: true, loading: false } : v
    ));
  };

  // Определяем ориентацию видео после загрузки метаданных
  const handleLoadedMetadata = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (video) {
      const isVertical = video.videoHeight > video.videoWidth;
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, isVertical } : v
      ));
      setDuration(prev => ({ ...prev, [videoId]: video.duration }));
    }
  };

  const togglePlay = async (videoId: string) => {
    const videoObj = videos.find(v => v.id === videoId);
    
    // Если видео не загружено, загружаем его
    if (videoObj && !videoObj.loaded && !videoObj.loading) {
      await loadVideo(videoId);
    }

    const video = videoRefs.current[videoId];
    if (!video) return;

    // Останавливаем все другие видео
    Object.keys(videoRefs.current).forEach(id => {
      if (id !== videoId && videoRefs.current[id]) {
        videoRefs.current[id].pause();
        setIsPlaying(prev => ({ ...prev, [id]: false }));
      }
    });

    if (isPlaying[videoId]) {
      video.pause();
      setIsPlaying(prev => ({ ...prev, [videoId]: false }));
      setCurrentVideo(null);
    } else {
      video.play();
      setIsPlaying(prev => ({ ...prev, [videoId]: true }));
      setCurrentVideo(videoId);
    }
  };

  const toggleMute = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(prev => ({ ...prev, [videoId]: video.muted }));
  };

  const handleTimeUpdate = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (video) {
      setCurrentTime(prev => ({ ...prev, [videoId]: video.currentTime }));
    }
  };

  const handleSeek = (videoId: string, time: number) => {
    const video = videoRefs.current[videoId];
    if (video) {
      video.currentTime = time;
      setCurrentTime(prev => ({ ...prev, [videoId]: time }));
    }
  };

  const handleVideoEnd = (videoId: string) => {
    setIsPlaying(prev => ({ ...prev, [videoId]: false }));
    setCurrentVideo(null);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    }
  };

  // Рендер для внешнего видео (VK, YouTube, etc.)
  const renderExternalVideo = (video: Video) => {
    const embedUrl = convertVKVideoUrl(video.url);
    
    return (
      <GlassCard key={video.id} className="p-6 animate-fade-in-left">
        <div className="aspect-video mb-4 rounded-lg overflow-hidden relative group bg-slate-100">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.name}
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200">
              <div className="text-center text-slate-500">
                <Play className="w-12 h-12 mx-auto mb-2" />
                <p className="font-poiret">Видео недоступно</p>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-poiret flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>{video.platform}</span>
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-poiret font-bold text-slate-800 mb-2">
          {video.name}
        </h3>
        {video.caption && (
          <p className="text-slate-600 font-poiret mb-4">{video.caption}</p>
        )}
        
        <div className="mt-4">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-poiret text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Смотреть на {video.platform}</span>
          </a>
        </div>
      </GlassCard>
    );
  };

  // Рендер заглушки для незагруженного видео
  const renderVideoPlaceholder = (video: Video) => {
    return (
      <GlassCard key={video.id} className="p-4 animate-fade-in-left">
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {video.loading ? (
                  <div className="flex flex-col items-center space-y-3">
                    <Loader className="w-12 h-12 text-slate-500 animate-spin" />
                    <p className="text-slate-600 font-poiret">Загрузка...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <button
                      onClick={() => loadVideo(video.id)}
                      className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 hover:scale-110 shadow-lg"
                    >
                      <Play className="w-8 h-8 text-slate-700 ml-1" />
                    </button>
                    <p className="text-slate-600 font-poiret text-sm">Нажмите для загрузки</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Type Badge */}
            <div className="absolute top-4 left-4">
              <div className="bg-green-500/80 text-white px-3 py-1 rounded-full text-xs font-poiret">
                Из галереи
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-lg font-poiret font-bold text-slate-800 truncate">
              {video.name}
            </h3>
            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-poiret mt-1">
              Ожидает загрузки
            </span>
          </div>
        </div>
      </GlassCard>
    );
  };

  // Рендер для локального видео (storage или embedded)
  const renderLocalVideo = (video: Video) => {
    // Если видео не загружено, показываем заглушку
    if (!video.loaded && video.type === 'storage') {
      return renderVideoPlaceholder(video);
    }

    return (
      <GlassCard key={video.id} className="p-4 animate-fade-in-left">
        <div className="relative group">
          <div className={`relative rounded-lg overflow-hidden bg-black ${
            video.isVertical ? 'aspect-[9/16]' : 'aspect-video'
          }`}>
            <video
              ref={(el) => {
                if (el) videoRefs.current[video.id] = el;
              }}
              src={video.url}
              className="w-full h-full object-contain cursor-pointer"
              onLoadedMetadata={() => handleLoadedMetadata(video.id)}
              onTimeUpdate={() => handleTimeUpdate(video.id)}
              onEnded={() => handleVideoEnd(video.id)}
              onClick={() => togglePlay(video.id)}
              onError={(e) => {
                console.error(`Video error for ${video.id}:`, video.url);
              }}
              muted={isMuted[video.id] || false}
              preload="metadata"
            />

            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
              <button
                onClick={() => togglePlay(video.id)}
                className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 hover:scale-110"
              >
                {isPlaying[video.id] ? (
                  <Pause className="w-8 h-8 text-slate-700" />
                ) : (
                  <Play className="w-8 h-8 text-slate-700 ml-1" />
                )}
              </button>
            </div>

            {/* Video Type Badge */}
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className={`px-3 py-1 rounded-full text-xs font-poiret ${
                video.type === 'storage' 
                  ? 'bg-green-500/80 text-white' 
                  : 'bg-blue-500/80 text-white'
              }`}>
                {video.type === 'storage' ? 'Загружено' : 'Встроено'}
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {duration[video.id] && (
                <div className="mb-3">
                  <input
                    type="range"
                    min="0"
                    max={duration[video.id] || 0}
                    value={currentTime[video.id] || 0}
                    onChange={(e) => handleSeek(video.id, parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f257cf 0%, #f257cf ${
                        ((currentTime[video.id] || 0) / (duration[video.id] || 1)) * 100
                      }%, rgba(255,255,255,0.3) ${
                        ((currentTime[video.id] || 0) / (duration[video.id] || 1)) * 100
                      }%, rgba(255,255,255,0.3) 100%)`
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => togglePlay(video.id)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    {isPlaying[video.id] ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleMute(video.id)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    {isMuted[video.id] ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  {duration[video.id] && (
                    <span className="text-xs">
                      {formatTime(currentTime[video.id] || 0)} / {formatTime(duration[video.id])}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {video.type === 'storage' && (
                    <a
                      href={video.url}
                      download
                      className="p-1 hover:bg-white/20 rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  
                  <button
                    onClick={() => handleFullscreen(video.id)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-lg font-poiret font-bold text-slate-800 truncate">
              {video.name}
            </h3>
            
            <div className="flex items-center space-x-2 mt-1">
              {video.isVertical && (
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-poiret">
                  Вертикальное
                </span>
              )}
              
              <span className={`inline-block px-2 py-1 text-xs rounded-full font-poiret ${
                video.type === 'storage' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {video.type === 'storage' ? 'Из галереи' : 'Встроенное'}
              </span>
            </div>

            {video.caption && (
              <p className="text-slate-600 font-poiret mt-2 text-sm">{video.caption}</p>
            )}
          </div>
        </div>
      </GlassCard>
    );
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

  if (error && videos.length === 0) {
    return (
      <section className="min-h-screen flex items-center px-4 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
              Видеопортфолио
            </h2>
            <p className="text-slate-600 text-lg font-poiret">Ошибка загрузки видео</p>
          </div>
          
          <GlassCard className="p-8 animate-scale-in">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4 text-slate-500">
                <Play className="w-16 h-16" />
                <p className="font-poiret">Не удалось загрузить видео</p>
                <p className="text-sm font-poiret">{error}</p>
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

  return (
    <section className="min-h-screen flex items-center px-4 py-12">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
            Видеопортфолио
          </h2>
          <p className="text-slate-600 text-lg font-poiret">Работы в эфире</p>
          
          {/* Statistics */}
          <div className="flex justify-center space-x-6 mt-4 text-sm text-slate-600 font-poiret">
            <span>Всего видео: {videos.length}</span>
            <span>Из галереи: {videos.filter(v => v.type === 'storage').length}</span>
            <span>Встроенных: {videos.filter(v => v.type === 'embedded').length}</span>
            <span>Внешних: {videos.filter(v => v.type === 'external').length}</span>
            {loadingStorageVideos && (
              <span className="text-blue-600 flex items-center space-x-1">
                <Loader className="w-3 h-3 animate-spin" />
                <span>Поиск видео...</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            // Для внешних видео используем iframe
            if (video.type === 'external') {
              return renderExternalVideo(video);
            }
            
            // Для локальных видео используем HTML5 плеер
            return renderLocalVideo(video);
          })}
        </div>
      </div>
    </section>
  );
};