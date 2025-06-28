/*
  # Add Storage Policy for Photo Gallery

  1. Security
    - Enable public read access to slideshow folder in annagavrilova bucket
    - Allow listing files in the slideshow directory
    - Allow public access to individual files

  This migration creates the necessary RLS policies for the photo gallery to work properly.
*/

-- Create policy to allow public read access to slideshow folder
CREATE POLICY "Allow public read access to slideshow folder"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'annagavrilova' AND (storage.foldername(name))[1] = 'slideshow');

-- Create policy to allow public access to files in slideshow folder
CREATE POLICY "Allow public access to slideshow files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'annagavrilova' AND name LIKE 'slideshow/%');