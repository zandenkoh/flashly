-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile."
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- DECKS
create table public.decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  is_public boolean default false,
  created_at timestamptz default now()
);

alter table public.decks enable row level security;

create policy "Users can view their own decks."
  on public.decks for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own decks."
  on public.decks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own decks."
  on public.decks for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own decks."
  on public.decks for delete
  using ( auth.uid() = user_id );

-- Public Decks Access
create policy "Anyone can view public decks."
  on public.decks for select
  using ( is_public = true );

-- CARDS
create table public.cards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamptz default now(),
  interval_days numeric default 0,
  ease_factor numeric default 2.5,
  last_reviewed timestamptz,
  due_at timestamptz,
  reviews_count integer default 0
);

alter table public.cards enable row level security;

-- Performance improvement: index on deck_id
create index idx_cards_deck_id on public.cards(deck_id);

-- RLS for cards based on deck ownership
create policy "Users can view cards in their ecosystem."
  on public.cards for select
  using (
    exists (
      select 1 from public.decks
      where public.decks.id = public.cards.deck_id
      and public.decks.user_id = auth.uid()
    )
  );

create policy "Users can insert cards into their decks."
  on public.cards for insert
  with check (
    exists (
      select 1 from public.decks
      where public.decks.id = deck_id
      and public.decks.user_id = auth.uid()
    )
  );

create policy "Users can update cards in their decks."
  on public.cards for update
  using (
    exists (
      select 1 from public.decks
      where public.decks.id = public.cards.deck_id
      and public.decks.user_id = auth.uid()
    )
  );

create policy "Users can delete cards from their decks."
  on public.cards for delete
  using (
    exists (
      select 1 from public.decks
      where public.decks.id = public.cards.deck_id
      and public.decks.user_id = auth.uid()
    )
  );

-- Public Cards Access
create policy "Anyone can view cards in public decks."
  on public.cards for select
  using (
    exists (
      select 1 from public.decks
      where public.decks.id = public.cards.deck_id
      and public.decks.is_public = true
    )
  );

-- TAGS
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text default '#cbd5e1',
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.tags enable row level security;

create policy "Users can view their own tags."
  on public.tags for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own tags."
  on public.tags for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own tags."
  on public.tags for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own tags."
  on public.tags for delete
  using ( auth.uid() = user_id );

-- CARD TAGS (Many-to-Many)
create table public.card_tags (
  card_id uuid references public.cards(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (card_id, tag_id)
);

alter table public.card_tags enable row level security;

create policy "Users can view tags on their cards."
  on public.card_tags for select
  using (
    exists (
      select 1 from public.cards
      join public.decks on public.cards.deck_id = public.decks.id
      where public.cards.id = card_tags.card_id
      and public.decks.user_id = auth.uid()
    )
  );

create policy "Users can add tags to their cards."
  on public.card_tags for insert
  with check (
    exists (
      select 1 from public.cards
      join public.decks on public.cards.deck_id = public.decks.id
      where public.cards.id = card_id
      and public.decks.user_id = auth.uid()
    )
  );
  
create policy "Users can remove tags from their cards."
  on public.card_tags for delete
  using (
    exists (
      select 1 from public.cards
      join public.decks on public.cards.deck_id = public.decks.id
      where public.cards.id = card_tags.card_id
      and public.decks.user_id = auth.uid()
    )
  );

-- STUDY LOGS (For Heatmap & Stats)
create table public.study_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  card_id uuid references public.cards(id) on delete cascade,
  deck_id uuid references public.decks(id) on delete cascade,
  rating integer not null, -- 1=Again, 2=Hard, 3=Good, 4=Easy
  review_time timestamptz default now()
);

alter table public.study_logs enable row level security;

create policy "Users can view their own study logs."
  on public.study_logs for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own study logs."
  on public.study_logs for insert
  with check ( auth.uid() = user_id );

-- GAME SCORES
create table public.game_scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  deck_id uuid references public.decks(id) on delete cascade,
  game_type text not null, -- 'match', 'gravity'
  score integer not null,
  created_at timestamptz default now()
);

alter table public.game_scores enable row level security;

create policy "Users can view their own scores."
  on public.game_scores for select
  using ( auth.uid() = user_id );
  
create policy "Users can insert their own scores."
  on public.game_scores for insert
  with check ( auth.uid() = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();