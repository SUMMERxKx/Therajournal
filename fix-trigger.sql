-- Fix for the user profile creation trigger
-- Run this in your Supabase SQL editor if the trigger isn't working

-- Drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust function for automatic user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with error handling
  INSERT INTO public.users (user_id, tz)
  VALUES (NEW.id, 'America/Vancouver')
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate insertions
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create a function to manually create user profiles if needed
CREATE OR REPLACE FUNCTION public.create_user_profile(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Try to insert the user profile
  INSERT INTO public.users (user_id, tz)
  VALUES (user_uuid, 'America/Vancouver')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Return the user profile
  SELECT to_json(users.*) INTO result
  FROM public.users
  WHERE user_id = user_uuid;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID) TO anon, authenticated;
