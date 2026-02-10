-- 1. Create a security definer function to check ownership without RLS recursion
create or replace function public.is_deck_owner(deck_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.decks
    where id = deck_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 2. Create a security definer function to check if a deck is shared with the current user
create or replace function public.is_deck_shared(deck_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.deck_shares
    where deck_id = is_deck_shared.deck_id
    and user_email = (auth.jwt() ->> 'email')
  );
end;
$$ language plpgsql security definer;

-- 3. DROP OLD POLICIES
drop policy if exists "Owners can manage shares for their decks." on public.deck_shares;
drop policy if exists "Users can view their own or shared decks." on public.decks;
drop policy if exists "Users can view cards in their ecosystem." on public.cards;
drop policy if exists "Users can view cards in their own, public or shared decks." on public.cards;
drop policy if exists "Users can view decks" on public.decks;
drop policy if exists "Owners can manage deck shares" on public.deck_shares;
drop policy if exists "Users can view cards" on public.cards;

-- 4. RE-IMPLEMENT POLICIES USING FUNCTIONS (Bypasses recursion)
create policy "Decks access"
  on public.decks for select
  using (
    auth.uid() = user_id 
    or is_public = true
    or public.is_deck_shared(id)
  );

create policy "Deck shares access"
  on public.deck_shares for all
  using (
    public.is_deck_owner(deck_id)
  );

create policy "Cards access"
  on public.cards for select
  using (
    exists (
      select 1 from public.decks
      where id = public.cards.deck_id
      and (
        user_id = auth.uid()
        or is_public = true
        or public.is_deck_shared(id)
      )
    )
  );
