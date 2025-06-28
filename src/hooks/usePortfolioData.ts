import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PortfolioSection, PortfolioData } from '../types';

export const usePortfolioData = () => {
  const [data, setData] = useState<PortfolioData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: sections, error } = await supabase
          .from('anna_ivanova_table')
          .select('*')
          .order('section_order', { ascending: true });

        if (error) {
          throw error;
        }

        const portfolioData: PortfolioData = {};
        
        sections?.forEach((section: PortfolioSection) => {
          switch (section.section_type) {
            case 'about':
              portfolioData.about = section.content as any;
              break;
            case 'skills':
              portfolioData.skills = section.content as any;
              break;
            case 'photos':
              // Photos will be loaded from storage, but keep this for fallback
              portfolioData.photos = (section.content as any).items || [];
              break;
            case 'videos':
              // Handle nested items structure and flatten it
              const videoContent = section.content as any;
              let videoItems = [];
              
              if (videoContent.items) {
                // Flatten nested items structure
                const flattenItems = (items: any[]): any[] => {
                  const result: any[] = [];
                  items.forEach(item => {
                    if (item.items && Array.isArray(item.items)) {
                      // If item has nested items, flatten them
                      result.push(...flattenItems(item.items));
                    } else if (item.id && item.url) {
                      // If item is a valid video object, add it
                      result.push(item);
                    }
                  });
                  return result;
                };
                
                videoItems = flattenItems(videoContent.items);
              }
              
              portfolioData.videos = videoItems;
              break;
            case 'audio':
              portfolioData.audio = (section.content as any).items || [];
              break;
            case 'contacts':
              portfolioData.contacts = (section.content as any).items || [];
              break;
          }
        });

        setData(portfolioData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};