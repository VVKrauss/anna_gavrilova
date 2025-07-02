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
  
  // Определяем секции динамически на основе доступных данных
  const allSections = [
    { key: 'about', component: AboutSection, data: data.about, title: 'Обо мне' },
    { key: 'skills', component: SkillsSection, data: data.skills, title: 'Навыки' },
    { key: 'photos', component: PhotosSection, data: data.photos, title: 'Фотогалерея' },
    { key: 'videos', component: VideosSection, data: data.videos, title: 'Видеопортфолио' },
    // { key: 'audio', component: AudioSection, data: data.audio, title: 'Аудио' },
    { key: 'contacts', component: ContactsSection, data: data.contacts, title: 'Контакты' },
  ];

  // Показываем только секции с данными, но about и contacts всегда показываем
  const sections = allSections.filter(section => {
    if (section.key === 'about' || section.key === 'contacts' || section.key === 'skills') {
      return section.data; // Обязательные секции
    }
    return section.data && (
      Array.isArray(section.data) ? section.data.length > 0 : section.data
    );
  });

  const sectionTitles = sections.map(section => section.title);

  // Intersection Observer для отслеживания видимых секций
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: 0.6
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionIndex = sectionRefs.current.findIndex(ref => ref === entry.target);
          if (sectionIndex !== -1) {
            setCurrentSection(sectionIndex);
          }
        }
      });
    }, observerOptions);

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [sections.length]);

  const scrollToSection = (sectionIndex) => {
    const targetSection = sectionRefs.current[sectionIndex];
    if (targetSection) {
      isScrollingRef.current = true;
      
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      setTimeout(() => {
        isScrollingRef.current = false;
        setCurrentSection(sectionIndex);
      }, 1000);
    }
  };

  useEffect(() => {
    let scrollTimeout;
    
    const handleWheel = (e) => {
      if (isScrollingRef.current) {
        e.preventDefault();
        return;
      }

      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const direction = e.deltaY > 0 ? 1 : -1;
        const nextSection = Math.max(0, Math.min(currentSection + direction, sections.length - 1));
        
        if (nextSection !== currentSection) {
          scrollToSection(nextSection);
        }
      }, 50);
    };

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

  // Убираем обработку критических ошибок - сайт должен работать в любом случае
  if (error && (!data.about && !data.contacts)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-8">
          <h1 className="text-2xl font-poiret font-bold text-slate-800 mb-4">
            Добро пожаловать!
          </h1>
          <p className="text-slate-600 mb-4 font-poiret">
            Сайт временно работает в автономном режиме. 
            Основная информация доступна ниже.
          </p>
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-left">
            <h2 className="font-poiret font-bold text-lg mb-2">Анна Гаврилова</h2>
            <p className="text-slate-700 font-poiret">
              Телеведущая канала 78, лауреат ТЭФИ-Мультимедиа
            </p>
            <div className="mt-4 pt-4 border-t border-white/30">
              <p className="text-sm text-slate-600 font-poiret">
                Email: kirido@mail.ru
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если нет секций для отображения, показываем минимальную версию
  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-poiret font-bold text-slate-800 mb-4">
            Анна Гаврилова
          </h1>
          <p className="text-slate-600 font-poiret text-lg">
            Портфолио загружается...
          </p>
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

      {/* Небольшое уведомление о статическом режиме (только для разработки) */}
      {process.env.NODE_ENV === 'development' && error && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800 max-w-sm">
          <strong>Режим разработки:</strong> Используются статические данные
        </div>
      )}
    </div>
  );
}

export default App;