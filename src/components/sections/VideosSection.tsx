// 1. Загружаем видео из Supabase Storage
        try {
          console.log('Fetching videos from storage...');
          
          // Пробуем получить содержимое папки video
          const { data: bucketData, error: bucketError } = await supabase
            .storage
            .from('annagavrilova')
            .list('video', {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });

          console.log('Storage API response:', { 
            success: !bucketError, 
            error: bucketError?.message,
            filesCount: bucketData?.length || 0 
          });

          let foundStorageVideos = false;

          if (!bucketError && bucketData && bucketData.length > 0) {
            const videoFiles = bucketData.filter(file => {
              return file.name && 
                     file.name !== '.emptyFolderPlaceholder' && 
                     /\.(mp4|mov|avi|webm|ogg|mkv)$/i.test(file.name);
            });

            if (videoFiles.length > 0) {
              const storageVideos: Video[] = videoFiles.map((file, index) => {
                const videoUrl = `https://uimport React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../GlassCard';
import { MediaItem } from '../../types';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Video {
  id: string;
  url: string;
  name: string;
  caption?: string;
  isVertical?: boolean;
  type: 'storage' | 'embedded' | 'external'; // Добавляем тип видео
  platform?: string; // Для внешних видео (VK, YouTube, etc.)
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
  
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        let allVideos: Video[] = [];
        
        // 1. Загружаем видео из Supabase Storage
        try {
          console.log('Fetching videos from storage...');
          
          // Сначала проверим, какие папки есть в корне bucket
          const { data: rootData, error: rootError } = await supabase
            .storage
            .from('annagavrilova')
            .list('', {
              limit: 100
            });
          
          console.log('Root bucket contents:', { rootData, rootError });
          
          // Теперь попробуем получить содержимое папки video
          const { data: bucketData, error: bucketError } = await supabase
            .storage
            .from('annagavrilova')
            .list('video', {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });

          console.log('Storage response:', { bucketData, bucketError });

          let foundStorageVideos = false;

          if (!bucketError && bucketData && bucketData.length > 0) {
            console.log('Raw bucket data:', bucketData);
            
            const videoFiles = bucketData.filter(file => {
              console.log('Checking file:', file);
              return file.name && 
                     file.name !== '.emptyFolderPlaceholder' && 
                     /\.(mp4|mov|avi|webm|ogg|mkv)$/i.test(file.name);
            });

            console.log('Filtered video files:', videoFiles);

            if (videoFiles.length > 0) {
              const storageVideos: Video[] = videoFiles.map((file, index) => {
                const videoUrl = `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/${encodeURIComponent(file.name)}`;
                console.log('Creating video object:', {
                  id: `storage-video-${index}`,
                  url: videoUrl,
                  name: file.name.replace(/\.[^/.]+$/, ''),
                  originalFileName: file.name
                });
                
                return {
                  id: `storage-video-${index}`,
                  url: videoUrl,
                  name: file.name.replace(/\.[^/.]+$/, ''),
                  type: 'storage'
                };
              });

              allVideos = [...allVideos, ...storageVideos];
              console.log('Created storage videos:', storageVideos);
              foundStorageVideos = true;
            }
          }

                      // Если не удалось получить список файлов через API, попробуем альтернативный подход
          if (!foundStorageVideos) {
            console.log('No files found via API, trying alternative approaches...');
            
            // Метод 1: Попробуем известные видеофайлы
            const knownVideoFiles = [
              'video_2025-07-01_20-05-03.mp4',
              // Можно добавить другие известные файлы
            ];

            // Метод 2: Попробуем сгенерировать возможные имена файлов
            const possibleVideoFiles = [
              ...knownVideoFiles,
              // Типичные паттерны названий видео
              'video.mp4',
              'video1.mp4',
              'video2.mp4',
              'video3.mp4',
              'sample.mp4',
              'demo.mp4',
              'portfolio.mp4',
              'showreel.mp4',
              'reel.mp4',
              // Паттерны с датами
              'video_2024.mp4',
              'video_2025.mp4',
              // Другие возможные расширения
              'video.mov',
              'video.webm',
              'video.avi'
            ];

            const workingVideos: Video[] = [];

            console.log('Testing possible video files...');
            
            // Ограничиваем количество одновременных запросов
            const batchSize = 5;
            for (let i = 0; i < possibleVideoFiles.length; i += batchSize) {
              const batch = possibleVideoFiles.slice(i, i + batchSize);
              
              await Promise.allSettled(
                batch.map(async (fileName) => {
                  const testUrl = `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/${encodeURIComponent(fileName)}`;
                  
                  try {
                    const response = await fetch(testUrl, { 
                      method: 'HEAD',
                      cache: 'no-cache'
                    });
                    
                    if (response.ok) {
                      console.log(`✅ Found video file: ${fileName}`);
                      const video: Video = {
                        id: `manual-video-${workingVideos.length}`,
                        url: testUrl,
                        name: fileName.replace(/\.[^/.]+$/, ''),
                        type: 'storage'
                      };
                      workingVideos.push(video);
                    } else {
                      console.log(`❌ File not found: ${fileName} (${response.status})`);
                    }
                  } catch (fetchError) {
                    console.log(`❌ Error accessing ${fileName}:`, fetchError.message);
                  }
                })
              );
              
              // Небольшая пауза между батчами
              if (i + batchSize < possibleVideoFiles.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }

            if (workingVideos.length > 0) {
              allVideos = [...allVideos, ...workingVideos];
              console.log(`🎉 Successfully found ${workingVideos.length} video files:`, workingVideos);
            } else {
              console.log('❌ No working video files found');
              
              // Показываем инструкцию
              console.log(`
🎥 КАК ДОБАВИТЬ ВИДЕО:

1. ЧЕРЕЗ SUPABASE DASHBOARD:
   - Откройте https://supabase.com/dashboard
   - Перейдите в проект annagavrilova
   - Storage > Buckets > annagavrilova > video/
   - Загрузите видеофайлы
   - Убедитесь что bucket публичный

2. ПРОВЕРЬТЕ НАСТРОЙКИ RLS:
   - Bucket должен быть public
   - Или настройте правильные RLS политики

3. ДОБАВЬТЕ ФАЙЛЫ В КОД:
   - Добавьте имена ваших видеофайлов в массив knownVideoFiles

Поддерживаемые форматы: .mp4, .mov, .avi, .webm, .ogg, .mkv
              `);
            }
          }
        } catch (storageErr) {
          console.error('Storage error details:', storageErr);
        }

        // 2. Добавляем видео из базы данных (встроенные и внешние)
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
              platform: isExternal ? getPlatformName(video.url) : undefined
            };
          });

          allVideos = [...allVideos, ...databaseVideos];
          console.log('Found database videos:', databaseVideos);
        }

        console.log('All videos combined:', allVideos);
        setVideos(allVideos);
      } catch (err) {
        console.error('Ошибка загрузки видео:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [data]);

  // Определяем ориентацию видео после загрузки метаданных (только для storage видео)
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

  const togglePlay = (videoId: string) => {
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
          
          {/* Platform badge */}
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
        
        {/* Direct link to original video */}
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

  // Рендер для локального видео (storage или embedded)
  const renderLocalVideo = (video: Video) => {
    return (
      <GlassCard key={video.id} className="p-4 animate-fade-in-left">
        <div className="relative group">
          {/* Video Container */}
          <div className={`relative rounded-lg overflow-hidden bg-black ${
            video.isVertical ? 'aspect-[9/16]' : 'aspect-video'
          }`}>
            <video
              ref={(el) => {
                if (el) videoRefs.current[video.id] = el;
              }}
              src={video.url}
              className="w-full h-full object-contain cursor-pointer"
              onLoadedMetadata={() => {
                console.log(`Video metadata loaded for ${video.id}:`, video.url);
                handleLoadedMetadata(video.id);
              }}
              onTimeUpdate={() => handleTimeUpdate(video.id)}
              onEnded={() => handleVideoEnd(video.id)}
              onClick={() => togglePlay(video.id)}
              onError={(e) => {
                console.error(`Video error for ${video.id}:`, e);
                console.error('Video URL:', video.url);
                const target = e.target as HTMLVideoElement;
                console.error('Video error details:', {
                  error: target.error,
                  networkState: target.networkState,
                  readyState: target.readyState
                });
              }}
              onLoadStart={() => console.log(`Video load start for ${video.id}`)}
              onCanPlay={() => console.log(`Video can play for ${video.id}`)}
              muted={isMuted[video.id] || false}
              preload="metadata"
              crossOrigin="anonymous"
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
              <div className={`px-3 py-1 rounded-full text-xs font-poiret flex items-center space-x-1 ${
                video.type === 'storage' 
                  ? 'bg-green-500/80 text-white' 
                  : 'bg-blue-500/80 text-white'
              }`}>
                <span>
                  {video.type === 'storage' ? 'Загружено' : 'Встроено'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Progress Bar */}
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

              {/* Control Buttons */}
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

          {/* Video Title */}
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