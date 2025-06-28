import React from 'react';
import { GlassCard } from '../GlassCard';
import { AboutContent } from '../../types';

interface AboutSectionProps {
  data: AboutContent;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ data }) => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <GlassCard className="p-8 md:p-12 animate-fade-in-up">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-poiret font-bold text-slate-800 mb-4">
                {data.name}
              </h1>
              <h2 className="text-xl md:text-2xl font-poiret font-light text-slate-600 mb-6 capitalize">
                {data.title}
              </h2>
              <div 
                className="text-lg leading-relaxed text-slate-700 font-poiret"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            </div>
            <div className="flex justify-center h-full">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-2xl opacity-20"></div>
                <img
                  src={data.imageUrl}
                  alt={data.name}
                  className="relative w-full h-full object-cover rounded-2xl shadow-2xl transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
};