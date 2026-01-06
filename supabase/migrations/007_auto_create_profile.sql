-- ============================================================================
-- MIGRATION 007: AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================================
-- Purpose: Automatically create a profile in public.profiles when a new user
--          signs up via Supabase Auth
-- ============================================================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Also create default user settings
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger to call the function when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check if trigger was created successfully
select trigger_name, event_object_table, action_statement
from information_schema.triggers
where trigger_name = 'on_auth_user_created';

-- ============================================================================
-- NOTES
-- ============================================================================
-- This trigger will:
-- 1. Create a profile automatically when auth.users gets a new row
-- 2. Extract full_name and avatar_url from user metadata if provided
-- 3. Also create default user_settings for the new user
-- 4. Handle conflicts gracefully (on conflict do nothing)
-- ============================================================================
