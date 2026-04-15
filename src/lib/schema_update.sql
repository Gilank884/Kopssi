-- =================================================================================
-- DATABASE SCHEMA UPDATE: Relationship-Based User Management
-- =================================================================================
-- 1. Add Foreign Key Relationship between personal_data and users
--    This ensures that personal_data.user_id points to a valid user.
--    Source of truth for Member Number (no_anggota) is purely in personal_data.
ALTER TABLE public.personal_data 
ADD CONSTRAINT fk_personal_data_users 
FOREIGN KEY (user_id) 
REFERENCES public.users(id)
ON DELETE SET NULL;

-- 2. (Optional) Cleanup redundant columns from users table
--    Since login now uses no_anggota from personal_data, 
--    the no_npp column in the users table is no longer needed.
-- ALTER TABLE public.users DROP COLUMN no_npp;

-- 3. Separate Jatuh Tempo and Tanggal Bayar in angsuran table
-- =================================================================================
-- Add jatuh_tempo column if not exists
ALTER TABLE public.angsuran ADD COLUMN IF NOT EXISTS jatuh_tempo TIMESTAMPTZ;

-- Migrate existing data: Copy current tanggal_bayar (due dates) to jatuh_tempo
UPDATE public.angsuran SET jatuh_tempo = tanggal_bayar;

-- Clear tanggal_bayar for unpaid installments (so it stays null until paid)
UPDATE public.angsuran SET tanggal_bayar = NULL WHERE status IS NULL OR status = 'UNPAID';

