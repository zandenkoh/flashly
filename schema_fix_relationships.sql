-- Fix relationship between group_members and profiles
alter table public.group_members 
  drop constraint if exists group_members_user_id_fkey,
  add constraint group_members_user_id_fkey 
    foreign key (user_id) 
    references public.profiles(id) 
    on delete cascade;

-- Ensure saved_decks also has a clean relationship
alter table public.saved_decks
  drop constraint if exists saved_decks_user_id_fkey,
  add constraint saved_decks_user_id_fkey
    foreign key (user_id)
    references public.profiles(id)
    on delete cascade;
