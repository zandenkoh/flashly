-- Create note_summaries table for AI generated summaries
CREATE TABLE IF NOT EXISTS public.note_summaries (
  id uuid default uuid_generate_v4() primary key,
  note_id uuid references public.notes(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  content jsonb not null,
  created_at timestamptz default now(),
  unique(note_id)
);

ALTER TABLE public.note_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view document summaries."
  ON public.note_summaries FOR SELECT
  USING (true);

CREATE POLICY "Users can create summaries."
  ON public.note_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);
