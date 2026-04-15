-- =================================================================================
-- DATABASE DATA MIGRATION: Standardizing Member Statuses
-- =================================================================================

-- 1. Migrate all forms of 'active' to 'AKTIF'
UPDATE public.personal_data 
SET status = 'AKTIF' 
WHERE status IN ('active', 'ACTIVE', 'approved', 'verified', 'AKTIF');

-- 2. Migrate all forms of 'inactive/removed' to 'KELUAR'
UPDATE public.personal_data 
SET status = 'KELUAR' 
WHERE status IN ('non_active', 'NON_ACTIVE', 'nonaktif', 'rejected', 'KELUAR');

-- 3. Migrate all forms of 'passive' to 'PASIF'
UPDATE public.personal_data 
SET status = 'PASIF' 
WHERE status IN ('pasif', 'PASIF');

-- Note: 'pending' and 'DONE VERIFIKASI' are kept as-is 
-- because they are temporary workflow statuses during registration.
