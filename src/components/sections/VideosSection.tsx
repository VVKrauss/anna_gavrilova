import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GlassCard } from '../GlassCard';
import { MediaItem } from '../../types';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, ExternalLink, SkipForward, SkipBack, Shuffle, Repeat, List, Grid } from 'lucide-react';
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
}

interface VideosSectionProps {
  data?: MediaItem[];
}

type ViewMode = 'grid' | 'playlist';
type RepeatMode = 'none' | 'one' | 'all';

// Function to convert VK video URL to embed URL
const convertVKVideoUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const vkVideoMatch = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (vkVideoMatch) {
    const oid = vkVideoMatch[1];
    const id = vkVideoMatch[2];
    return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`;
  }
  
  if (url.includes('video_ext.php')) return url;
  return url;
};

// Function to get platform name from URL
const getPlatformName = (url: string): string => {
  if (!url || typeof url !== 'string') return 'Видео';
  
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
  
  // Playback state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Playlist state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffled, setIsShuffled] = useState(false);
  const [playOrder, setPlayOrder] = useState<number[]>([]);
  const [autoplay, setAutoplay] = useState(false);
  
  // Lazy loading state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Fallback: Load videos by testing pattern
  const loadVideosByPattern = async (): Promise<Video[]> => {
    console.log('🔍 Testing video pattern...');
    const foundVideos: Video[] = [];
    const extensions = ['mp4', 'mov', 'avi', 'webm'];
    
    // Test common patterns
    const testPatterns = [
      // Numbered patterns
      ...Array.from({ length: 20 }, (_, i) => {
        const num = (i + 1).toString().padStart(2, '0');
        return extensions.map(ext => `video_${num}.${ext}`);
      }).flat(),
      // Simple patterns
      ...extensions.map(ext => [`video.${ext}`, `test.${ext}`, `demo.${ext}`]).flat(),
      // Known file (if exists)
      'video_2025-07-01_20-05-03.mp4'
    ];

    console.log(`🧪 Testing ${testPatterns.length} patterns...`);

    // Test in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < testPatterns.length; i += batchSize) {
      const batch = testPatterns.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(async (fileName) => {
          const testUrl = `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/${encodeURIComponent(fileName)}`;
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(testUrl, { 
              method: 'HEAD',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log(`✅ Found: ${fileName}`);
              return {
                id: `pattern-video-${foundVideos.length}`,
                url: testUrl,
                name: fileName.replace(/\.[^/.]+$/, ''),
                type: 'storage' as const,
                loaded: true
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        })
      );
      
      // Add successful results
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          foundVideos.push(result.value);
        }
      });
      
      // Small delay between batches
      if (i + batchSize < testPatterns.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`🎯 Pattern search found ${foundVideos.length} videos`);
    return foundVideos;
  };

  // Initialize videos
  const initializeVideos = useCallback(async () => {
    try {
      setLoading(true);
      let allVideos: Video[] = [];
      
      // 1. Load embedded/external videos first (instant)
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
            loaded: true
          };
        });

        allVideos = [...allVideos, ...databaseVideos];
        console.log('✅ Loaded embedded/external videos:', databaseVideos.length);
      }

      // 2. Load storage videos from Supabase - check video folder
      try {
        console.log('🔍 Checking storage bucket video/ folder...');
        
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .from('annagavrilova')
          .list('video', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        console.log('📦 Storage response:', { bucketData, bucketError });

        if (!bucketError && bucketData && bucketData.length > 0) {
          console.log('📂 Found files:', bucketData.map(f => f.name));
          
          const videoFiles = bucketData.filter(file => 
            file.name && 
            file.name !== '.emptyFolderPlaceholder' && 
            /\.(mp4|mov|avi|webm|ogg|mkv)$/i.test(file.name)
          );

          console.log('🎥 Video files:', videoFiles.map(f => f.name));

          if (videoFiles.length > 0) {
            const storageVideos: Video[] = videoFiles.map((file, index) => {
              const videoUrl = `https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/${encodeURIComponent(file.name)}`;
              
              console.log(`📹 Creating video: ${file.name} -> ${videoUrl}`);
              
              return {
                id: `storage-video-${index}`,
                url: videoUrl,
                name: file.name.replace(/\.[^/.]+$/, ''),
                type: 'storage',
                loaded: true
              };
            });

            allVideos = [...allVideos, ...storageVideos];
            console.log('✅ Added storage videos:', storageVideos.length);
          } else {
            console.log('📁 No video files found in storage folder');
          }
        } else {
          console.log('📭 Storage video/ folder is empty');
          
          // If API doesn't work, try to access the known file directly
          console.log('🔍 Testing known video file: video_2.mp4');
          try {
            const testUrl = 'https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/video/video_2.mp4';
            const response = await fetch(testUrl, { method: 'HEAD' });
            
            if (response.ok) {
              console.log('✅ Found video_2.mp4 directly!');
              const directVideo: Video = {
                id: 'direct-video-2',
                url: testUrl,
                name: 'video_2',
                type: 'storage',
                loaded: true
              };
              allVideos = [...allVideos, directVideo];
              console.log('🎯 Added direct video file');
            } else {
              console.log('❌ video_2.mp4 not accessible:', response.status);
            }
          } catch (err) {
            console.log('❌ Error testing direct video:', err);
          }
        }
      } catch (storageErr) {
        console.log('⚠️ Storage loading failed:', storageErr);
      }

      setVideos(allVideos);
      
      // Initialize play order
      const order = Array.from({ length: allVideos.length }, (_, i) => i);
      setPlayOrder(order);
      
      setLoading(false);
      
    } catch (err) {
      console.error('Ошибка инициализации видео:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      setLoading(false);
    }
  }, [data]);

  // Playlist functions
  const shuffleArray = (array: number[]): number[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const toggleShuffle = () => {
    const newShuffled = !isShuffled;
    setIsShuffled(newShuffled);
    
    if (newShuffled) {
      const shuffled = shuffleArray(Array.from({ length: videos.length }, (_, i) => i));
      setPlayOrder(shuffled);
    } else {
      const normal = Array.from({ length: videos.length }, (_, i) => i);
      setPlayOrder(normal);
    }
  };

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const playVideo = (index: number) => {
    const video = videos[index];
    if (!video || !video.loaded || video.type === 'external') return;
    
    // Pause current video
    const currentVideo = videoRefs.current[videos[currentVideoIndex]?.id];
    if (currentVideo) {
      currentVideo.pause();
    }
    
    setCurrentVideoIndex(index);
    
    // Play new video
    setTimeout(() => {
      const newVideo = videoRefs.current[video.id];
      if (newVideo) {
        newVideo.play();
        setIsPlaying(true);
      }
    }, 100);
  };

  const playNext = () => {
    const currentOrderIndex = playOrder.indexOf(currentVideoIndex);
    let nextIndex = currentOrderIndex + 1;
    
    if (nextIndex >= playOrder.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    
    playVideo(playOrder[nextIndex]);
  };

  const playPrevious = () => {
    const currentOrderIndex = playOrder.indexOf(currentVideoIndex);
    let prevIndex = currentOrderIndex - 1;
    
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = playOrder.length - 1;
      } else {
        return;
      }
    }
    
    playVideo(playOrder[prevIndex]);
  };

  const togglePlayPause = () => {
    const video = videoRefs.current[videos[currentVideoIndex]?.id];
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleVideoEnd = () => {
    if (repeatMode === 'one') {
      const video = videoRefs.current[videos[currentVideoIndex]?.id];
      if (video) {
        video.currentTime = 0;
        video.play();
      }
    } else if (autoplay) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRefs.current[videos[currentVideoIndex]?.id];
    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    }
  };

  const handleSeek = (time: number) => {
    const video = videoRefs.current[videos[currentVideoIndex]?.id];
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize on mount
  useEffect(() => {
    initializeVideos();
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [initializeVideos]);

  // Update play order when videos change
  useEffect(() => {
    if (videos.length > 0) {
      const order = Array.from({ length: videos.length }, (_, i) => i);
      setPlayOrder(isShuffled ? shuffleArray(order) : order);
    }
  }, [videos.length, isShuffled]);

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
                <p className="text-slate-600 font-poiret">Загрузка плеера...</p>
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

  const currentVideo = videos[currentVideoIndex];

  return (
    <section className="min-h-screen flex items-center px-4 py-12">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
            Видеопортфолио
          </h2>
          <p className="text-slate-600 text-lg font-poiret">Работы в эфире</p>
          
          {/* View Mode Toggle */}
          <div className="flex justify-center mt-6">
            <div className="flex bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-full text-sm font-poiret transition-all flex items-center space-x-2 ${
                  viewMode === 'grid' 
                    ? 'bg-white/40 text-slate-800' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Галерея</span>
              </button>
              <button
                onClick={() => setViewMode('playlist')}
                className={`px-4 py-2 rounded-full text-sm font-poiret transition-all flex items-center space-x-2 ${
                  viewMode === 'playlist' 
                    ? 'bg-white/40 text-slate-800' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Плейлист</span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'playlist' ? (
          /* Playlist Mode */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Player */}
            <div className="lg:col-span-2">
              <GlassCard className="p-6 animate-fade-in-up">
                {currentVideo ? (
                  <div className="relative group">
                    {currentVideo.type === 'external' ? (
                      /* External Video */
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={convertVKVideoUrl(currentVideo.url)}
                          title={currentVideo.name}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      /* Local Video */
                      <div className="aspect-video rounded-lg overflow-hidden bg-black relative">
                        <video
                          ref={(el) => {
                            if (el) videoRefs.current[currentVideo.id] = el;
                          }}
                          src={currentVideo.url}
                          className="w-full h-full object-contain"
                          onTimeUpdate={handleTimeUpdate}
                          onEnded={handleVideoEnd}
                          onLoadedMetadata={handleTimeUpdate}
                          muted={isMuted}
                        />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                          <button
                            onClick={togglePlayPause}
                            className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 hover:scale-110"
                          >
                            {isPlaying ? (
                              <Pause className="w-8 h-8 text-slate-700" />
                            ) : (
                              <Play className="w-8 h-8 text-slate-700 ml-1" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Video Info */}
                    <div className="mt-4">
                      <h3 className="text-xl font-poiret font-bold text-slate-800 mb-2">
                        {currentVideo.name}
                      </h3>
                      {currentVideo.caption && (
                        <p className="text-slate-600 font-poiret">{currentVideo.caption}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-slate-100 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <Play className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-poiret">Выберите видео для воспроизведения</p>
                    </div>
                  </div>
                )}
                
                {/* Playlist Controls */}
                {currentVideo && currentVideo.type !== 'external' && (
                  <div className="mt-6 space-y-4">
                    {/* Progress Bar */}
                    {duration > 0 && (
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max={duration}
                          value={currentTime}
                          onChange={(e) => handleSeek(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #f257cf 0%, #f257cf ${
                              (currentTime / duration) * 100
                            }%, #e2e8f0 ${(currentTime / duration) * 100}%, #e2e8f0 100%)`
                          }}
                        />
                        <div className="flex justify-between text-sm text-slate-600 font-poiret">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={toggleShuffle}
                        className={`p-2 rounded-full transition-all ${
                          isShuffled 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/20 text-slate-600 hover:bg-white/30'
                        }`}
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={playPrevious}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                      >
                        <SkipBack className="w-4 h-4 text-slate-600" />
                      </button>
                      
                      <button
                        onClick={togglePlayPause}
                        className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full transition-all hover:scale-105"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>
                      
                      <button
                        onClick={playNext}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                      >
                        <SkipForward className="w-4 h-4 text-slate-600" />
                      </button>
                      
                      <button
                        onClick={toggleRepeat}
                        className={`p-2 rounded-full transition-all relative ${
                          repeatMode !== 'none' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/20 text-slate-600 hover:bg-white/30'
                        }`}
                      >
                        <Repeat className="w-4 h-4" />
                        {repeatMode === 'one' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full text-xs flex items-center justify-center text-white">1</span>
                        )}
                      </button>
                    </div>
                    
                    {/* Autoplay Toggle */}
                    <div className="flex items-center justify-center">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoplay}
                          onChange={(e) => setAutoplay(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full transition-all ${
                          autoplay ? 'bg-purple-500' : 'bg-slate-300'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                            autoplay ? 'translate-x-5' : 'translate-x-1'
                          } mt-1`} />
                        </div>
                        <span className="text-sm font-poiret text-slate-600">Автовоспроизведение</span>
                      </label>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
            
            {/* Playlist */}
            <div className="lg:col-span-1">
              <GlassCard className="p-4 animate-fade-in-right">
                <h3 className="font-poiret font-bold text-slate-800 mb-4 flex items-center">
                  <List className="w-4 h-4 mr-2" />
                  Плейлист ({videos.length})
                </h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {playOrder.map((videoIndex, orderIndex) => {
                    const video = videos[videoIndex];
                    if (!video) return null;
                    
                    const isActive = videoIndex === currentVideoIndex;
                    
                    return (
                      <button
                        key={video.id}
                        onClick={() => playVideo(videoIndex)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isActive 
                            ? 'bg-purple-500/20 border border-purple-500/30' 
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {isActive && isPlaying ? (
                              <Pause className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Play className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`font-poiret font-medium truncate ${
                              isActive ? 'text-purple-800' : 'text-slate-800'
                            }`}>
                              {orderIndex + 1}. {video.name}
                            </p>
                            
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-poiret ${
                                video.type === 'storage' 
                                  ? 'bg-green-100 text-green-700' 
                                  : video.type === 'external'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {video.type === 'storage' ? 'Галерея' : 
                                 video.type === 'external' ? video.platform : 'Встроено'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          </div>
        ) : (
          /* Grid Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => {
              // External videos (VK, YouTube, etc.)
              if (video.type === 'external') {
                const embedUrl = convertVKVideoUrl(video.url);
                
                return (
                  <GlassCard key={video.id} className="p-4 animate-fade-in-left">
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
                      
                      {/* Playlist add button */}
                      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => {
                            setCurrentVideoIndex(index);
                            setViewMode('playlist');
                          }}
                          className="bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-xs font-poiret hover:bg-white transition-all"
                        >
                          В плейлист
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-poiret font-bold text-slate-800 truncate">
                        {video.name}
                      </h3>
                      
                      {video.caption && (
                        <p className="text-slate-600 font-poiret text-sm">{video.caption}</p>
                      )}
                      
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors font-poiret text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Смотреть на {video.platform}</span>
                      </a>
                    </div>
                  </GlassCard>
                );
              }
              
              // Local videos (storage/embedded)
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
                        onLoadedMetadata={() => {
                          const videoEl = videoRefs.current[video.id];
                          if (videoEl) {
                            const isVertical = videoEl.videoHeight > videoEl.videoWidth;
                            setVideos(prev => prev.map(v => 
                              v.id === video.id ? { ...v, isVertical } : v
                            ));
                          }
                        }}
                        onClick={() => {
                          setCurrentVideoIndex(index);
                          setViewMode('playlist');
                          playVideo(index);
                        }}
                        onError={(e) => {
                          console.error(`Video error for ${video.id}:`, e);
                        }}
                        muted
                        preload="metadata"
                        crossOrigin="anonymous"
                      />

                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 hover:bg-white transition-all duration-200 hover:scale-110">
                          <Play className="w-8 h-8 text-slate-700 ml-1" />
                        </div>
                      </div>

                      {/* Video type badge */}
                      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className={`px-3 py-1 rounded-full text-xs font-poiret ${
                          video.type === 'storage' 
                            ? 'bg-green-500/80 text-white' 
                            : 'bg-purple-500/80 text-white'
                        }`}>
                          {video.type === 'storage' ? 'Галерея' : 'Встроено'}
                        </div>
                      </div>

                      {/* Playlist add button */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentVideoIndex(index);
                            setViewMode('playlist');
                          }}
                          className="bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-xs font-poiret hover:bg-white transition-all"
                        >
                          В плейлист
                        </button>
                      </div>

                      {/* Quick action buttons */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                        {video.type === 'storage' && (
                          <a
                            href={video.url}
                            download
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4 text-slate-700" />
                          </a>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const videoEl = videoRefs.current[video.id];
                            if (videoEl && videoEl.requestFullscreen) {
                              videoEl.requestFullscreen();
                            }
                          }}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
                        >
                          <Maximize className="w-4 h-4 text-slate-700" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <h3 className="text-lg font-poiret font-bold text-slate-800 truncate">
                        {video.name}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2">
                        {video.isVertical && (
                          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-poiret">
                            Вертикальное
                          </span>
                        )}
                        
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-poiret ${
                          video.type === 'storage' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {video.type === 'storage' ? 'Из галереи' : 'Встроенное'}
                        </span>
                      </div>

                      {video.caption && (
                        <p className="text-slate-600 font-poiret text-sm">{video.caption}</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};