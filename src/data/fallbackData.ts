import { PortfolioData } from '../types';

// Статические данные для работы сайта без Supabase
export const fallbackData: PortfolioData = {
  about: {
    name: 'Анна Гаврилова',
    title: 'Телеведущая канала 78, лауреат ТЭФИ-Мультимедиа',
    description: `Я — российская телеведущая, журналист и автор, известная своей работой на телеканале «78».<br><br>
    
    <strong>Мои программы:</strong><br>
    • «Гид 78. Рестораны Петербурга» — популярная программа о ресторанной культуре города<br>
    • «А как это по-русски» — авторская программа о русском языке и культуре<br><br>
    
    <strong>Достижения:</strong><br>
    • Лауреат премии ТЭФИ-Мультимедиа за проект «Хочу и буду»<br>
    • Соавтор социального проекта «Энергия доброты»<br>
    • Радиоведущая на Радио Мария<br><br>
    
    <strong>Образование:</strong><br>
    • СПбГУ, факультет журналистики<br>
    • Член Союза журналистов России`,
    imageUrl: 'https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/images/anna.png'
  },
  
  skills: {
    name: 'Анна Гаврилова', 
    title: 'Профессиональные навыки',
    description: `Более 10 лет опыта в телевизионной журналистике и ведении программ. Специализируюсь на создании качественного контента для различных форматов передач.<br><br>
    
    <strong>Основные навыки:</strong><br>
    • Ведение телевизионных программ<br>
    • Интервьюирование<br>
    • Работа в прямом эфире<br>
    • Создание сценариев<br>
    • Работа с камерой<br>
    • Редактирование контента<br><br>
    
    <strong>Опыт работы:</strong><br>
    • Канал 78 - ведущая программ<br>
    • Радио Мария - радиоведущая<br>
    • Фриланс проекты<br><br>
    
    <strong>Образование:</strong><br>
    • СПбГУ, факультет журналистики<br>
    • Член Союза журналистов России`,
    imageUrl: 'https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/images/skills-photo.jpg'
  },
  
  contacts: [
    {
      platform: 'Email',
      url: 'mailto:kirido@mail.ru',
      icon: 'Mail'
    },
    {
      platform: 'Instagram',
      url: 'https://instagram.com/annakirido',
      icon: 'Instagram'
    },
    {
      platform: 'Telegram',
      url: 'https://t.me/Angavrilova',
      icon: 'Telegram'
    }
  ],
  
  photos: [], // Фото будут загружаться из storage, если доступно
  videos: [], // Видео пока пустые
  audio: []   // Аудио пока пустые
};