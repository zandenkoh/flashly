-- Add is_public column to decks
ALTER TABLE public.decks 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- TAGS
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#cbd5e1',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags."
  ON public.tags FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own tags."
  ON public.tags FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own tags."
  ON public.tags FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own tags."
  ON public.tags FOR DELETE
  USING ( auth.uid() = user_id );

-- CARD TAGS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.card_tags (
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

ALTER TABLE public.card_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags on their cards."
  ON public.card_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cards
      JOIN public.decks ON public.cards.deck_id = public.decks.id
      WHERE public.cards.id = card_tags.card_id
      AND public.decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tags to their cards."
  ON public.card_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards
      JOIN public.decks ON public.cards.deck_id = public.decks.id
      WHERE public.cards.id = card_id
      AND public.decks.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can remove tags from their cards."
  ON public.card_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards
      JOIN public.decks ON public.cards.deck_id = public.decks.id
      WHERE public.cards.id = card_tags.card_id
      AND public.decks.user_id = auth.uid()
    )
  );

-- STUDY LOGS (For Heatmap & Stats)
CREATE TABLE IF NOT EXISTS public.study_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  card_id uuid REFERENCES public.cards(id) ON DELETE CASCADE,
  deck_id uuid REFERENCES public.decks(id) ON DELETE CASCADE, -- Denormalized for easier querying
  rating integer NOT NULL, -- 1=Again, 2=Hard, 3=Good, 4=Easy
  review_time timestamptz DEFAULT now()
);

ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study logs."
  ON public.study_logs FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own study logs."
  ON public.study_logs FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- GAME SCORES
CREATE TABLE IF NOT EXISTS public.game_scores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  deck_id uuid REFERENCES public.decks(id) ON DELETE CASCADE,
  game_type text NOT NULL, -- 'match', 'gravity'
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scores."
  ON public.game_scores FOR SELECT
  USING ( auth.uid() = user_id );
  
CREATE POLICY "Users can insert their own scores."
  ON public.game_scores FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- PUBLIC DECKS ACCESS
-- Modify existing policies or add new ones for public access
-- NOTE: We must be careful not to expose private decks.

-- Create a policy for ANYONE to view PUBLIC decks
CREATE POLICY "Anyone can view public decks."
  ON public.decks FOR SELECT
  USING ( is_public = true );

-- Create a policy for ANYONE to view CARDS in PUBLIC decks
CREATE POLICY "Anyone can view cards in public decks."
  ON public.cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE public.decks.id = public.cards.deck_id
      AND public.decks.is_public = true
    )
  );

-- Ensure relationship for Community Decks
ALTER TABLE public.decks
DROP CONSTRAINT IF EXISTS decks_user_id_fkey,
ADD CONSTRAINT decks_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;