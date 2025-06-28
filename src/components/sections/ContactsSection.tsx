import React from 'react';
import { GlassCard } from '../GlassCard';
import { ContactItem } from '../../types';
import { Instagram, Send, Mail, ExternalLink } from 'lucide-react';

interface ContactsSectionProps {
  data: ContactItem[];
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Instagram':
      return Instagram;
    case 'Telegram':
      return Send; // Send icon for Telegram
    case 'Mail':
      return Mail;
    default:
      return ExternalLink;
  }
};

export const ContactsSection: React.FC<ContactsSectionProps> = ({ data }) => {
  // Default contacts - only Email, Instagram, and Telegram
  const defaultContacts: ContactItem[] = [
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
  ];

  // Use database data if available, otherwise use default contacts
  const contacts = data && data.length > 0 ? data : defaultContacts;

  return (
    <section className="min-h-screen flex items-center px-4 py-12">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-poiret font-bold text-slate-800 mb-4">
            Контакты
          </h2>
          <p className="text-slate-600 text-lg font-poiret">Свяжитесь со мной</p>
        </div>

        <GlassCard className="p-8 md:p-12 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {contacts.map((contact, index) => {
              const IconComponent = getIcon(contact.icon);
              return (
                <a
                  key={index}
                  href={contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-center hover:bg-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-poiret font-bold text-slate-800 group-hover:text-slate-900 transition-colors mb-2">
                      {contact.platform}
                    </h3>
                    <p className="text-sm text-slate-600 font-poiret">
                      {contact.platform === 'Email' && 'kirido@mail.ru'}
                      {contact.platform === 'Instagram' && '@annakirido'}
                      {contact.platform === 'Telegram' && '@Angavrilova'}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
          
          <div className="text-center">
            <p className="text-slate-600 mb-4 font-poiret">
              Открыта для новых проектов и сотрудничества
            </p>
            <a
              href="mailto:kirido@mail.ru"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-poiret font-medium py-3 px-8 rounded-full inline-block transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              Связаться со мной
            </a>
          </div>
        </GlassCard>
      </div>
    </section>
  );
};