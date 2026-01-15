-- Create profiles table
create table if not exists profiles (
  wallet_address text primary key,
  username text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid()::text = wallet_address ); -- Note: This assumes auth.uid() maps to wallet address or we handle this via app logic. 
  -- Ideally, if using Privy, we might need to rely on the app to upsert securely or use a trigger/function if auth.uid() is not the wallet address.
  -- For this MVP, we will allow upsert via service role or careful RLS if we had auth hooked up perfectly.
  -- Since we are using Privy and standard Supabase client might not have the wallet address as uid directly without custom auth config, 
  -- we might need to be careful. For now, we'll allow public insert/update but in a real app we'd verify the signature.
  -- Let's make it simple: service role will handle upserts for now, or we allow anyone to insert (unsafe) but we'll stick to service role for writes in API.

-- For now, let's keep it simple and just create the table.  Writing will be done via API with Admin client (Service Role) which bypasses RLS.

-- Alter bounties table to support multi-prizes
alter table bounties 
add column if not exists prizes jsonb default '[]'::jsonb,
add column if not exists winners jsonb default '[]'::jsonb;

-- Alter submissions table for transparency and results
alter table submissions
add column if not exists is_public boolean default false,
add column if not exists prize_won numeric,
add column if not exists rank integer;

-- Add comment to explain prizes format
comment on column bounties.prizes is 'Array of prize tiers, e.g., [{"rank": 1, "amount": "100"}, {"rank": 2, "amount": "50"}]';
