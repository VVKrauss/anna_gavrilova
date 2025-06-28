import React from 'react';
import { GlassCard } from '../GlassCard';
import { MediaItem } from '../../types';
import { ExternalLink, Play } from 'lucide-react';

interface VideosSectionProps {
  data: MediaItem[];
}

// Function to convert VK video URL to embed URL
const convertVKVideoUrl = (url: string): string => {
  // Check if url is valid
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  // Check if it's a VK video URL like https://vk.com/video-26548409_456273982
  const vkVideoMatch = url.match(/vk\.com\/video(-?\d+)_(\d+)/);
  if (vkVideoMatch) {
    const oid = vkVideoMatch[1];
    const id = vkVideoMatch[2];
    return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`;
  }
  
  // If it's already an embed URL, return as is
  if (url.includes('video_ext.php')) {
    return url;
  }
  
  // For other URLs, return as is
  return url;
};

// Function to get platform name from URL
const getPlatformName = (url: string): string => {
  // Check if url is valid
  if (!url || typeof url !== 'string') {
    return 'Видео';
  }
  
  if (url.includes('vk.com')) return 'VK';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('rutube.ru')) return 'RuTube';
  return 'Видео';
};

export const VideosSection: React.FC<VideosSectionProps> = ({ data }) => {
  // Filter out videos with invalid URLs and ensure data is an array
  const validVideos = Array.isArray(data) ? data.filter(video => 
    video && video.url && typeof video.url === 'string' && video.url.trim() !== ''
  ) : [];

  console.log('Videos data received:', data);
  console.log('Valid videos:', validVideos);

  return (
    <section className="min-h-screen flex items-center px-4 py-12">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
            Видеопортфолио
          </h2>
          <p className="text-slate-600 text-lg font-poiret">Работы в эфире</p>
        </div>

        {validVideos.length === 0 ? (
          <div className="text-center py-12">
            <GlassCard className="p-8">
              <div className="flex flex-col items-center space-y-4 text-slate-500">
                <Play className="w-16 h-16" />
                <p className="text-slate-600 font-poiret text-lg">Видео скоро появятся</p>
                {data && !Array.isArray(data) && (
                  <p className="text-sm text-red-500">Ошибка: неверный формат данных видео</p>
                )}
              </div>
            </GlassCard>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {validVideos.map((video, index) => {
              const embedUrl = convertVKVideoUrl(video.url);
              const platform = getPlatformName(video.url);
              
              return (
                <GlassCard key={video.id || `video-${index}`} className="p-6 animate-fade-in-left">
                  <div className="aspect-video mb-4 rounded-lg overflow-hidden relative group bg-slate-100">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={video.title || 'Видео'}
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
                        <span>{platform}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-poiret font-bold text-slate-800 mb-2">
                    {video.title || 'Без названия'}
                  </h3>
                  {video.caption && (
                    <p className="text-slate-600 font-poiret">{video.caption}</p>
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
                      <span>Смотреть на {platform}</span>
                    </a>
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