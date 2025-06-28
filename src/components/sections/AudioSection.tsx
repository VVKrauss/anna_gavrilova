import React, { useState, useRef } from 'react';
import { GlassCard } from '../GlassCard';
import { MediaItem } from '../../types';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioSectionProps {
  data: MediaItem[];
}

export const AudioSection: React.FC<AudioSectionProps> = ({ data }) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const togglePlayPause = (audioId: string) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    if (currentlyPlaying === audioId) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      // Pause any currently playing audio
      if (currentlyPlaying) {
        audioRefs.current[currentlyPlaying]?.pause();
      }
      audio.play();
      setCurrentlyPlaying(audioId);
    }
  };

  const handleAudioEnd = (audioId: string) => {
    if (currentlyPlaying === audioId) {
      setCurrentlyPlaying(null);
    }
  };

  return (
    <section className="min-h-screen flex items-center px-4 py-12">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
            Аудио
          </h2>
          <p className="text-slate-600 text-lg font-poiret">Голос в эфире</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {data.map((audio, index) => (
            <GlassCard key={audio.id} className="p-6 animate-fade-in-right">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => togglePlayPause(audio.id)}
                  className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  {currentlyPlaying === audio.id ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" />
                  )}
                </button>
                
                <div className="flex-1">
                  <h3 className="text-xl font-poiret font-bold text-slate-800 mb-1">
                    {audio.title}
                  </h3>
                  <p className="text-slate-600 mb-2 font-poiret">{audio.caption}</p>
                  
                  {currentlyPlaying === audio.id && (
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <Volume2 className="w-4 h-4 animate-ping" />
                      <span className="font-poiret">Воспроизведение...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <audio
                ref={(el) => {
                  if (el) audioRefs.current[audio.id] = el;
                }}
                src={audio.url}
                onEnded={() => handleAudioEnd(audio.id)}
                className="hidden"
              />
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};