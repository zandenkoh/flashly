-- Groups Table
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references auth.users not null,
  invite_code text unique not null default substring(md5(random()::text) from 0 for 9),
  created_at timestamptz default now()
);

-- Group Members Table
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Saved Decks Table (Shortcuts)
create table public.saved_decks (
  user_id uuid references auth.users not null,
  deck_id uuid references public.decks(id) on delete cascade not null,
  saved_at timestamptz default now(),
  primary key (user_id, deck_id)
);

-- Update Decks Table
alter table public.decks add column group_id uuid references public.groups(id) on delete cascade;

-- RLS Policies

-- Groups
alter table public.groups enable row level security;

create policy "Users can view groups they are members of."
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Users can insert groups."
  on public.groups for insert
  with check ( auth.uid() = created_by );

-- Automatically add creator as admin member
create or replace function public.handle_new_group()
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_group_created
  after insert on public.groups
  for each row execute procedure public.handle_new_group();


-- Group Members
alter table public.group_members enable row level security;

create policy "Members can view other members in their groups."
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Users can join groups via code (logic handled in app but allow insert)."
  on public.group_members for insert
  with check ( auth.uid() = user_id );

create policy "Admins can remove members."
  on public.group_members for delete
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
    )
    or auth.uid() = user_id -- Can leave group
  );

-- Saved Decks
alter table public.saved_decks enable row level security;

create policy "Users can view their saved decks."
  on public.saved_decks for select
  using ( auth.uid() = user_id );

create policy "Users can insert saved decks."
  on public.saved_decks for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete saved decks."
  on public.saved_decks for delete
  using ( auth.uid() = user_id );

-- Update Decks RLS to include Group visibility
-- Note: Modifying existing policies is harder in pure SQL scripts without dropping them.
-- We will add a NEW policy for Group access.

create policy "Group members can view group decks."
  on public.decks for select
  using (
    group_id is not null and
    exists (
      select 1 from public.group_members
      where group_members.group_id = decks.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can insert decks into group."
  on public.decks for insert
  with check (
    group_id is not null and
    exists (
      select 1 from public.group_members
      where group_members.group_id = group_id
      and group_members.user_id = auth.uid()
    )
  );
  
-- Allow updates if you are the creator OR an admin of the group? 
-- For simplicity, let's keep it to creator for now, or group admins.
-- Let's stick to creator for simplicity in this iteration, matching 'Users can update their own decks'.
