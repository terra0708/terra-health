-- Migration to add phone_number and personal_email to user_profiles table

ALTER TABLE user_profiles
ADD COLUMN phone_number VARCHAR(50),
ADD COLUMN personal_email VARCHAR(255);
