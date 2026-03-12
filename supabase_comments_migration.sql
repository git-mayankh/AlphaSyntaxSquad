-- Create the idea_comments table
CREATE TABLE IF NOT EXISTS public.idea_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read comments
CREATE POLICY "Comments are viewable by everyone" 
  ON public.idea_comments FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own comments
CREATE POLICY "Users can insert their own comments" 
  ON public.idea_comments FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" 
  ON public.idea_comments FOR UPDATE 
  USING (auth.uid() = author_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON public.idea_comments FOR DELETE 
  USING (auth.uid() = author_id);

-- Add a foreign key constraint for the author mapping if not automatically inferred by Supabase
-- This allows the `author:profiles!idea_comments_author_id_fkey(name, avatar_url)` query to work.
ALTER TABLE public.idea_comments
  ADD CONSTRAINT idea_comments_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
