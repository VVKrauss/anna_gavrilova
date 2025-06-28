import React from 'react';
import { GlassCard } from '../GlassCard';
import { AboutContent } from '../../types';

interface SkillsSectionProps {
  data: AboutContent;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ data }) => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <GlassCard className="p-8 md:p-12 animate-fade-in-up">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Photo on the left (swapped position) */}
            <div className="flex justify-center h-full order-2 md:order-1">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-2xl opacity-20"></div>
                <img
                  src={data.imageUrl}
                  alt="Профессиональные навыки"
                  className="relative w-full h-full object-cover rounded-2xl shadow-2xl transition-transform duration-700 hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800';
                  }}
                />
              </div>
            </div>
            
            {/* Text content on the right (swapped position) */}
            <div className="text-center md:text-left order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-6">
                ЧТО Я УМЕЮ
              </h2>
              <div 
                className="text-lg leading-relaxed text-slate-700 font-poiret"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
};