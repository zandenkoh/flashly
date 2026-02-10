-- DECK SHARES (For direct user sharing)
create table public.deck_shares (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  user_email text not null,
  role text default 'viewer', -- 'viewer', 'editor'
  created_at timestamptz default now(),
  unique(deck_id, user_email)
);

alter table public.deck_shares enable row level security;

-- Policies for deck_shares
create policy "Owners can manage shares for their decks."
  on public.deck_shares for all
  using (
    exists (
      select 1 from public.decks
      where public.decks.id = deck_id
      and public.decks.user_id = auth.uid()
    )
  );

-- Update DECKS RLS to include shared users
drop policy if exists "Users can view their own decks." on public.decks;
create policy "Users can view their own or shared decks."
  on public.decks for select
  using (
    auth.uid() = user_id 
    or is_public = true
    or exists (
      select 1 from public.deck_shares
      where public.deck_shares.deck_id = public.decks.id
      and public.deck_shares.user_email = auth.jwt() ->> 'email'
    )
  );

-- Update CARDS RLS to include shared users
drop policy if exists "Users can view cards in their ecosystem." on public.cards;
create policy "Users can view cards in their own, public or shared decks."
  on public.cards for select
  using (
    exists (
      select 1 from public.decks
      where public.decks.id = public.cards.deck_id
      and (
        public.decks.user_id = auth.uid()
        or public.decks.is_public = true
        or exists (
          select 1 from public.deck_shares
          where public.deck_shares.deck_id = public.decks.id
          and public.deck_shares.user_email = auth.jwt() ->> 'email'
        )
      )
    )
  );
