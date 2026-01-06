-- Create a superadmin account for testing
-- This script should be run AFTER you sign up with your email through the UI

-- Update the email below to your superadmin email
DO $$
DECLARE
  superadmin_email TEXT := 'assassined13@gmail.com'; -- Change this to your email
BEGIN
  -- Set is_superadmin to true for the specified email
  UPDATE users 
  SET is_superadmin = true
  WHERE email = superadmin_email;
  
  -- Log the result
  IF FOUND THEN
    RAISE NOTICE 'Superadmin privileges granted to: %', superadmin_email;
  ELSE
    RAISE NOTICE 'User not found with email: %. Please sign up first.', superadmin_email;
  END IF;
END $$;

-- Verify the superadmin was created
SELECT id, email, is_superadmin, is_disabled
FROM users
WHERE is_superadmin = true;
