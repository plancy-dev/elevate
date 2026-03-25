-- Elevate: pre-init cleanup (run BEFORE 001_initial_schema.sql)
-- WARNING: Destructive. Intended for resetting a dev/staging DB or a one-time clean install.
-- - Drops all schemas whose names start with "snapp" (e.g. snapp_polling, snapp_receipt_*).
-- - Drops all user objects in schema public (tables, matviews, views, enums, functions).
-- Do NOT run against production without backup.

-- ---------------------------------------------------------------------------
-- 1) Schemas starting with snapp (case-sensitive; matches snapp_polling, etc.)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT nspname
    FROM pg_namespace
    WHERE nspname LIKE 'snapp%'
      AND nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  LOOP
    RAISE NOTICE 'Dropping schema %', r.nspname;
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', r.nspname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) public: materialized views first
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT matviewname
    FROM pg_matviews
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', r.matviewname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) public: views
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', r.table_name);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4) public: tables (FK order handled by CASCADE)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5) public: enum / composite types (after tables)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
  LOOP
    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6) public: regular functions (triggers already gone with tables)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p', 'w')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.fname || ' CASCADE';
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 7) public: sequences left without table (orphans)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
  LOOP
    EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', r.relname);
  END LOOP;
END $$;
