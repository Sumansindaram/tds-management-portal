-- First migration: Add super_admin to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';