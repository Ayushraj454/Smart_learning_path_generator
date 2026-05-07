/*
  # Auto-create profile on user signup

  1. New Functions
    - `handle_new_user()` - Trigger function that creates a profile row
      when a new user signs up in auth.users

  2. New Triggers
    - `on_auth_user_created` - Fires after insert on auth.users
      to automatically create the corresponding profile row

  3. Security
    - Uses SECURITY DEFINER to run as the database owner
    - Only creates the profile with default values
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
