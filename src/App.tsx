import React, { useState, useEffect, useRef } from 'react';
import { usePortfolioData } from './hooks/usePortfolioData';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Navigation } from './components/Navigation';
import { AboutSection } from './components/sections/AboutSection';
import { SkillsSection } from './components/sections/SkillsSection';
import { PhotosSection } from './components/sections/PhotosSection';
import { VideosSection } from './components/sections/VideosSection';
import { AudioSection } from './components/sections/AudioSection';
import { ContactsSection } from './components/sections/ContactsSection';

function App() {
  const { data, loading, error } = usePortfolioData();
  const [currentSection, setCurrentSection] = useState(0);
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const isScrollingRef = useRef(false);
  
  const sections = [
    { key: 'about', component: AboutSection, data: data.about, title: 'Обо мне' },
    { key: 'skills', component: SkillsSection, data: data.skills, title: 'Навыки' },
    { key: 'photos', component: PhotosSection, data: data.photos, title: 'Фотогалерея' },
    { key: 'videos', component: VideosSection, data: data.videos, title: 'Видеопортфолио' },
    // { key: 'audio', component: AudioSection, data: data.audio, title: 'Аудио' },
    { key: 'contacts', component: ContactsSection, data: data.contacts, title: 'Контакты' },
  ].filter(section => section.data); // Only show sections with data

  const sectionTitles = sections.map(section => section.title);

  // Intersection Observer для отслеживания видимых секций
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px', // Секция считается активной когда занимает 60% экрана
      threshold: 0.6
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return; // Игнорируем во время программного скролла

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionIndex = sectionRefs.current.findIndex(ref => ref === entry.target);
          if (sectionIndex !== -1) {
            setCurrentSection(sectionIndex);
          }
        }
      });
    }, observerOptions);

    // Наблюдаем за всеми секциями
    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [sections.length]);

  // Плавный скролл к секции
  const scrollToSection = (sectionIndex) => {
    const targetSection = sectionRefs.current[sectionIndex];
    if (targetSection) {
      isScrollingRef.current = true;
      
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Сбрасываем флаг после завершения анимации
      setTimeout(() => {
        isScrollingRef.current = false;
        setCurrentSection(sectionIndex);
      }, 1000);
    }
  };

  // Обработка скролла колесиком мыши для пошагового перехода
  useEffect(() => {
    let scrollTimeout;
    
    const handleWheel = (e) => {
      if (isScrollingRef.current) {
        e.preventDefault();
        return;
      }

      // Очищаем предыдущий таймаут
      clearTimeout(scrollTimeout);
      
      // Устанавливаем новый таймаут для определения окончания скролла
      scrollTimeout = setTimeout(() => {
        const direction = e.deltaY > 0 ? 1 : -1;
        const nextSection = Math.max(0, Math.min(currentSection + direction, sections.length - 1));
        
        if (nextSection !== currentSection) {
          scrollToSection(nextSection);
        }
      }, 50); // Небольшая задержка для группировки событий скролла
    };

    // Добавляем пассивный слушатель
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
        clearTimeout(scrollTimeout);
      };
    }
  }, [currentSection, sections.length]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-poiret font-bold text-red-600 mb-4">
            Ошибка загрузки
          </h1>
          <p className="text-slate-600">
            Пожалуйста, убедитесь, что Supabase настроен правильно.
          </p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-x-hidden"
      style={{
        scrollBehavior: 'smooth',
        scrollSnapType: 'y mandatory'
      }}
    >
      {/* Floating decorative orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none transition-all duration-1000"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none transition-all duration-1000"></div>
      <div className="fixed top-3/4 left-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl pointer-events-none transition-all duration-1000"></div>

      {/* Navigation */}
      {sections.length > 1 && (
        <Navigation
          currentSection={currentSection}
          totalSections={sections.length}
          sectionTitles={sectionTitles}
          onSectionChange={scrollToSection}
        />
      )}

      {/* Sections */}
      {sections.map((section, index) => {
        const SectionComponent = section.component;
        return (
          <div 
            key={section.key} 
            ref={(el) => (sectionRefs.current[index] = el)}
            className="relative z-10 min-h-screen transition-all duration-500 ease-out"
            style={{
              scrollSnapAlign: 'start',
              scrollSnapStop: 'normal'
            }}
          >
            <SectionComponent data={section.data} />
          </div>
        );
      })}
    </div>
  );
}

export default App;