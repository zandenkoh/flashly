-- 1. DROP ALL POTENTIALLY CONFLICTING POLICIES FIRST
-- This ensures a clean slate for our corrected policies
drop policy if exists "Decks access" on public.decks;
drop policy if exists "Cards access" on public.cards;
drop policy if exists "Deck shares access" on public.deck_shares;
drop policy if exists "Users can view their own study logs." on public.study_logs;
drop policy if exists "Users can view their own or shared decks." on public.decks;
drop policy if exists "Group members can view group decks." on public.decks;
drop policy if exists "Group members can insert decks into group." on public.decks;
drop policy if exists "Anyone can view public decks." on public.decks;
drop policy if exists "Anyone can view cards in public decks." on public.cards;
drop policy if exists "Study logs access" on public.study_logs;
drop policy if exists "Users can view their own study logs." on public.study_logs;

-- 2. CREATE ROBUST SECURITY DEFINER FUNCTIONS
-- We use "p_" prefix for parameters to avoid any ambiguity with column names

-- Check if user owns the deck
create or replace function public.is_deck_owner(p_deck_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.decks
    where public.decks.id = p_deck_id
    and public.decks.user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Check if deck is shared via deck_shares
create or replace function public.is_deck_shared(p_deck_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.deck_shares
    where public.deck_shares.deck_id = p_deck_id
    and public.deck_shares.user_email = (auth.jwt() ->> 'email')
  );
end;
$$ language plpgsql security definer;

-- Check if deck is visible via group membership
create or replace function public.is_group_deck(p_deck_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.decks d
    join public.group_members gm on d.group_id = gm.group_id
    where d.id = p_deck_id
    and gm.user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Master function to check if a user can view a deck
create or replace function public.can_view_deck(p_deck_id uuid)
returns boolean as $$
declare
  is_pub boolean;
begin
  -- 1. Check if it's public (fastest)
  select is_public into is_pub from public.decks where id = p_deck_id;
  if is_pub then
    return true;
  end if;

  -- 2. Check ownership, sharing, or group
  return (
    public.is_deck_owner(p_deck_id) or
    public.is_deck_shared(p_deck_id) or
    public.is_group_deck(p_deck_id)
  );
end;
$$ language plpgsql security definer;

-- 3. APPLY POLICIES

-- DECKS
create policy "decks_select_policy"
  on public.decks for select
  using (
    auth.uid() = user_id 
    or is_public = true
    or public.is_deck_shared(id)
    or exists (
       select 1 from public.group_members gm
       where gm.group_id = public.decks.group_id
       and gm.user_id = auth.uid()
    )
  );

-- CARDS
create policy "cards_select_policy"
  on public.cards for select
  using (
    public.can_view_deck(deck_id)
  );

-- DECK SHARES
create policy "deck_shares_policy"
  on public.deck_shares for all
  using (
    public.is_deck_owner(deck_id)
  );

-- STUDY LOGS
-- Users should see their own logs OR logs for decks they can view (for group stats)
create policy "study_logs_select_policy"
  on public.study_logs for select
  using (
    auth.uid() = user_id
    or public.can_view_deck(deck_id)
  );

create policy "study_logs_insert_policy"
  on public.study_logs for insert
  with check (
    auth.uid() = user_id
  );

-- GAME SCORES
create policy "game_scores_select_policy"
  on public.game_scores for select
  using (
    auth.uid() = user_id
    or public.can_view_deck(deck_id)
  );
