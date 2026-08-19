-- ==============================================================================
-- Peso a Peso - Row Level Security (RLS) Policies
-- Version: 1.2
-- ==============================================================================

-- Enable Row Level Security on all user-scoped tables
alter table profiles enable row level security;
alter table budgets enable row level security;
alter table expenses enable row level security;
alter table fixed_expenses enable row level security;
alter table alerts enable row level security;
alter table alert_feedback enable row level security;
alter table behavior_profiles enable row level security;
alter table financial_snapshots enable row level security;
alter table agent_events enable row level security;
alter table categories enable row level security;

-- 1. PROFILES
create policy "Users can view their own profile"
    on profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on profiles for update
    using (auth.uid() = id);

create policy "Users can insert their own profile"
    on profiles for insert
    with check (auth.uid() = id);

-- 2. CATEGORIES (Read-only for all authenticated users)
create policy "Categories are viewable by authenticated users"
    on categories for select
    using (auth.role() = 'authenticated');

-- 3. BUDGETS
create policy "Users can manage their own budgets"
    on budgets for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 4. EXPENSES
create policy "Users can manage their own expenses"
    on expenses for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 5. FIXED_EXPENSES
create policy "Users can manage their own fixed expenses"
    on fixed_expenses for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 6. ALERTS
create policy "Users can view their own alerts"
    on alerts for select
    using (auth.uid() = user_id);

create policy "Users can update their own alerts (mark seen)"
    on alerts for update
    using (auth.uid() = user_id);

-- 7. ALERT_FEEDBACK
create policy "Users can manage their own alert feedback"
    on alert_feedback for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 8. BEHAVIOR_PROFILES
create policy "Users can view and update their behavior profile"
    on behavior_profiles for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 9. FINANCIAL_SNAPSHOTS
create policy "Users can view their financial snapshots"
    on financial_snapshots for select
    using (auth.uid() = user_id);

-- 10. AGENT_EVENTS
create policy "Users can view their agent events"
    on agent_events for select
    using (auth.uid() = user_id);
