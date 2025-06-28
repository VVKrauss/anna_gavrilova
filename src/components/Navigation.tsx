import React from 'react';

interface NavigationProps {
  currentSection: number;
  totalSections: number;
  sectionTitles: string[];
  onSectionChange: (section: number) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentSection, 
  totalSections, 
  sectionTitles,
  onSectionChange 
}) => {
  return (
    <nav className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 p-4">
      <div className="flex flex-col items-end space-y-3">
        {Array.from({ length: totalSections }, (_, index) => (
          <div key={index} className="group flex items-center space-x-3">
            {/* Title - показывается при наведении на десктопе, скрыт на мобильных */}
            <span className={`
              text-slate-700 text-sm font-poiret whitespace-nowrap
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              hidden md:block
              ${index === currentSection ? 'font-bold text-slate-800' : ''}
            `}>
              {sectionTitles[index]}
            </span>
            
            {/* Navigation dot */}
            <button
              onClick={() => onSectionChange(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSection
                  ? 'bg-slate-600 scale-125'
                  : 'bg-slate-300 hover:bg-slate-400 hover:scale-110'
              }`}
              aria-label={`Go to ${sectionTitles[index]}`}
            />
          </div>
        ))}
      </div>
    </nav>
  );
};