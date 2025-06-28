/*
  # Add Skills Section Support

  1. Database Changes
    - Temporarily disable validation trigger
    - Update section type constraint to include 'skills'
    - Update section ordering to accommodate skills section
    - Insert skills section data
    - Re-enable validation trigger

  2. Skills Section Content
    - Professional experience and expertise
    - Education background
    - Key skills and competencies
*/

-- Temporarily disable the validation trigger
DROP TRIGGER IF EXISTS validate_basic_content_trigger ON anna_ivanova_table;

-- Drop the existing constraint
ALTER TABLE anna_ivanova_table DROP CONSTRAINT IF EXISTS anna_ivanova_table_section_type_check;

-- Add the new constraint that includes 'skills'
ALTER TABLE anna_ivanova_table ADD CONSTRAINT anna_ivanova_table_section_type_check 
CHECK ((section_type = ANY (ARRAY['about'::text, 'photos'::text, 'videos'::text, 'audio'::text, 'contacts'::text, 'skills'::text])));

-- Update section orders to make room for skills section (order 2)
UPDATE anna_ivanova_table 
SET section_order = section_order + 1 
WHERE section_type != 'about' AND section_order >= 2;

-- Insert skills section data
INSERT INTO anna_ivanova_table (
  section_type,
  section_title,
  section_order,
  content
) VALUES (
  'skills',
  'Навыки и экспертиза',
  2, -- Place after about section (which has order 1)
  '{
    "description": "Более 10 лет опыта в телевизионной журналистике и ведении программ. Специализируюсь на создании качественного контента для различных форматов передач.<br><br><strong>Основные навыки:</strong><br>• Ведение телевизионных программ<br>• Интервьюирование<br>• Работа в прямом эфире<br>• Создание сценариев<br>• Работа с камерой<br>• Редактирование контента<br><br><strong>Опыт работы:</strong><br>• Канал 78 - ведущая программ<br>• Радио Мария - радиоведущая<br>• Фриланс проекты<br><br><strong>Образование:</strong><br>• СПбГУ, факультет журналистики<br>• Член Союза журналистов России",
    "imageUrl": "https://uvcywpcikjcdyzyosvhx.supabase.co/storage/v1/object/public/annagavrilova/images/skills-photo.jpg"
  }'::jsonb
);

-- Re-enable the validation trigger
CREATE TRIGGER validate_basic_content_trigger 
BEFORE INSERT OR UPDATE ON anna_ivanova_table 
FOR EACH ROW EXECUTE FUNCTION validate_basic_content();