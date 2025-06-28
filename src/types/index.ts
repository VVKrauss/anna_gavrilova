export interface AboutContent {
  name: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface SkillsContent {
  description: string;
  imageUrl: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  title?: string;
  caption: string;
}

export interface ContactItem {
  platform: string;
  url: string;
  icon: string;
}

export interface PortfolioSection {
  id: string;
  section_type: 'about' | 'skills' | 'photos' | 'videos' | 'audio' | 'contacts';
  section_title: string;
  section_order: number;
  content: AboutContent | SkillsContent | { items: MediaItem[] } | { items: ContactItem[] };
  created_at: string;
  updated_at: string;
}

export interface PortfolioData {
  about?: AboutContent;
  skills?: SkillsContent;
  photos?: MediaItem[];
  videos?: MediaItem[];
  audio?: MediaItem[];
  contacts?: ContactItem[];
}