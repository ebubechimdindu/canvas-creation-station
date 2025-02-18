
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create driver_bank_accounts table
CREATE TABLE public.driver_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT max_accounts_per_driver CHECK (
        NOT EXISTS (
            SELECT 1 FROM public.driver_bank_accounts dba2
            WHERE dba2.driver_id = driver_bank_accounts.driver_id
            GROUP BY dba2.driver_id
            HAVING COUNT(*) > 2
        )
    )
);

-- Create function to handle primary account setting
CREATE OR REPLACE FUNCTION public.set_primary_bank_account(
    p_account_id UUID,
    p_driver_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, set all accounts for this driver to not primary
    UPDATE public.driver_bank_accounts
    SET is_primary = false
    WHERE driver_id = p_driver_id;
    
    -- Then set the specified account as primary
    UPDATE public.driver_bank_accounts
    SET is_primary = true
    WHERE id = p_account_id AND driver_id = p_driver_id;
    
    -- Throw an error if the account doesn't exist or belong to the driver
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found or does not belong to the driver';
    END IF;
END;
$$;

-- Create RLS policies
ALTER TABLE public.driver_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policy for selecting bank accounts
CREATE POLICY "Drivers can view their own bank accounts"
    ON public.driver_bank_accounts
    FOR SELECT
    TO authenticated
    USING (driver_id = auth.uid());

-- Policy for inserting bank accounts
CREATE POLICY "Drivers can add their own bank accounts"
    ON public.driver_bank_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (driver_id = auth.uid());

-- Policy for updating bank accounts
CREATE POLICY "Drivers can update their own bank accounts"
    ON public.driver_bank_accounts
    FOR UPDATE
    TO authenticated
    USING (driver_id = auth.uid())
    WITH CHECK (driver_id = auth.uid());

-- Policy for deleting bank accounts
CREATE POLICY "Drivers can delete their own bank accounts"
    ON public.driver_bank_accounts
    FOR DELETE
    TO authenticated
    USING (driver_id = auth.uid());

-- Update Database Types
CREATE TYPE public.bank_account_type AS (
    id UUID,
    driver_id UUID,
    bank_name TEXT,
    account_number TEXT,
    account_holder_name TEXT,
    is_primary BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

