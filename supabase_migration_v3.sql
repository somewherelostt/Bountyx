-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS twitter text,
ADD COLUMN IF NOT EXISTS discord text;
