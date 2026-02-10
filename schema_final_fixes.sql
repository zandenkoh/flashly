-- Proper foreign key relationships for join lookups
alter table public.group_members 
  drop constraint if exists group_members_user_id_fkey,
  add constraint group_members_user_id_fkey 
    foreign key (user_id) 
    references public.profiles(id) 
    on delete cascade;

alter table public.saved_decks
  drop constraint if exists saved_decks_user_id_fkey,
  add constraint saved_decks_user_id_fkey
    foreign key (user_id)
    references public.profiles(id)
    on delete cascade;

alter table public.study_logs
  drop constraint if exists study_logs_user_id_fkey,
  add constraint study_logs_user_id_fkey
    foreign key (user_id)
    references public.profiles(id)
    on delete cascade;
