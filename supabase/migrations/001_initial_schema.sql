-- ==============================================================================
-- Peso a Peso - Initial Database Schema
-- Version: 1.2
-- ==============================================================================

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    currency text not null default 'ARS',
    monthly_income numeric(14,2),
    payday smallint,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint profiles_payday_check
        check (payday is null or payday between 1 and 31)
);

-- 2. CATEGORIES
create table if not exists categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    slug text not null unique,
    created_at timestamptz not null default now()
);

-- 3. BUDGETS
create table if not exists budgets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    month date not null,
    amount numeric(14,2) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint budgets_amount_check
        check (amount >= 0),

    constraint budgets_month_unique
        unique (user_id, month)
);

-- 4. EXPENSES
create table if not exists expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    category_id uuid not null references categories(id),
    amount numeric(14,2) not null,
    description text,
    merchant text,
    expense_date date not null,
    source text not null default 'manual',
    confidence numeric(5,4),
    confirmed boolean not null default true,
    receipt_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint expenses_amount_check
        check (amount > 0),

    constraint expenses_source_check
        check (source in ('manual', 'text', 'ocr')),

    constraint expenses_confidence_check
        check (
            confidence is null
            or confidence between 0 and 1
        )
);

-- 5. FIXED_EXPENSES
create table if not exists fixed_expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    category_id uuid not null references categories(id),
    name text not null,
    expected_amount numeric(14,2) not null,
    due_day smallint not null,
    priority text not null default 'normal',
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint fixed_expenses_amount_check
        check (expected_amount >= 0),

    constraint fixed_expenses_due_day_check
        check (due_day between 1 and 31),

    constraint fixed_expenses_priority_check
        check (priority in ('low', 'normal', 'high'))
);

-- 6. ALERTS
create table if not exists alerts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    type text not null,
    severity text not null,
    title text not null,
    message text not null,
    category_id uuid references categories(id),
    agent_source text not null,
    created_at timestamptz not null default now(),
    seen_at timestamptz,

    constraint alerts_severity_check
        check (severity in ('info', 'warning', 'critical')),

    constraint alerts_agent_source_check
        check (
            agent_source in (
                'capture',
                'analyzer',
                'planner',
                'evaluator',
                'meta_agent'
            )
        )
);

-- 7. ALERT_FEEDBACK
create table if not exists alert_feedback (
    id uuid primary key default gen_random_uuid(),
    alert_id uuid not null references alerts(id) on delete cascade,
    user_id uuid not null references profiles(id) on delete cascade,
    feedback text not null,
    created_at timestamptz not null default now(),

    constraint alert_feedback_value_check
        check (feedback in ('useful', 'not_useful'))
);

-- 8. BEHAVIOR_PROFILES (Semantic Memory)
create table if not exists behavior_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references profiles(id) on delete cascade,
    preferred_tone text not null default 'neutral',
    alert_frequency text not null default 'normal',
    category_scores jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),

    constraint behavior_tone_check
        check (preferred_tone in ('neutral', 'friendly', 'direct')),

    constraint behavior_frequency_check
        check (alert_frequency in ('low', 'normal', 'high'))
);

-- 9. FINANCIAL_SNAPSHOTS
create table if not exists financial_snapshots (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    snapshot_date date not null,
    total_budget numeric(14,2) not null,
    spent numeric(14,2) not null,
    remaining numeric(14,2) not null,
    available_per_day numeric(14,2) not null,
    projected_total numeric(14,2),
    risk_level text,
    created_at timestamptz not null default now(),

    constraint snapshot_risk_check
        check (
            risk_level is null
            or risk_level in ('low', 'medium', 'high')
        )
);

-- 10. AGENT_EVENTS (Observability & Traceability)
create table if not exists agent_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    request_id uuid not null,
    agent_name text not null,
    event_type text not null,
    input_data jsonb,
    output_data jsonb,
    status text not null,
    duration_ms integer,
    created_at timestamptz not null default now(),

    constraint agent_name_check
        check (
            agent_name in (
                'capture',
                'analyzer',
                'planner',
                'evaluator',
                'meta_agent'
            )
        ),

    constraint agent_status_check
        check (status in ('started', 'success', 'failed'))
);

-- INDEXES
create index if not exists idx_expenses_user_date on expenses(user_id, expense_date);
create index if not exists idx_expenses_user_category on expenses(user_id, category_id);
create index if not exists idx_budgets_user_month on budgets(user_id, month);
create index if not exists idx_alerts_user_created on alerts(user_id, created_at desc);
create index if not exists idx_agent_events_request on agent_events(request_id);
create index if not exists idx_agent_events_user_created on agent_events(user_id, created_at desc);
