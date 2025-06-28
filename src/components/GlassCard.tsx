import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hover = true 
}) => {
  return (
    <div 
      className={`
        bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl
        ${hover ? 'hover:bg-white/25 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};