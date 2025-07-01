import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../GlassCard';
import { MediaItem } from '../../types';
import { Play, Pause, Volume2, VolumeX, Maximize, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Video {
  id: string;
  url: string;
  name: string;
  isVertical?: boolean;
}

interface VideosSectionProps {
  data?: MediaItem[];
}

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
        
        // Загружаем видео из Supabase Storage
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .from('annagavrilova')
          .list('video', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (bucketError) {
          console.error('Storage error:', bucketError);
          throw bucketError;
        }

        if (!bucketData || bucketData.length === 0) {
          console.log('No video files found in storage');
          setVideos([]);
          setLoading(false);
          return;
        }

        // Фильтруем только видеофайлы
        const videoFiles = bucketData.filter(file => 
          file.name && /\.(mp4|mov|avi|webm|ogg|mkv)$/i.test(file.name)
        );

        console.log('Found video files:', videoFiles);

        const videoItems: Video[] = videoFiles.map((file, index) => ({
          id: `video-${index}`,
          url: `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/${file.name}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        }));

        console.log('Created video items:', videoItems);
        setVideos(videoItems);
      } catch (err) {
        console.error('Ошибка загрузки видео:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        
        // Fallback to database data if available
        if (data && data.length > 0) {
          const fallbackVideos: Video[] = data.map((item, index) => ({
            id: item.id || `fallback-${index}`,
            url: item.url || '',
            name: item.title || `video-${index}`,
          }));
          setVideos(fallbackVideos);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [data]);

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
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
                    onLoadedMetadata={() => handleLoadedMetadata(video.id)}
                    onTimeUpdate={() => handleTimeUpdate(video.id)}
                    onEnded={() => handleVideoEnd(video.id)}
                    onClick={() => togglePlay(video.id)}
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
                        <a
                          href={video.url}
                          download
                          className="p-1 hover:bg-white/20 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        
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
                  {video.isVertical && (
                    <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-poiret">
                      Вертикальное видео
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};