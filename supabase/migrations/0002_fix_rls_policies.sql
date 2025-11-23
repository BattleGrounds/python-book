-- Отключаем RLS временно для настройки
alter table public.profiles disable row level security;

-- Удаляем старые политики если они есть
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can manage modules" on public.modules;
drop policy if exists "Anyone can view published modules" on public.modules;
drop policy if exists "Anyone can view lessons in published modules" on public.lessons;
drop policy if exists "Admins can manage lessons" on public.lessons;
drop policy if exists "Users can view own submissions" on public.submissions;
drop policy if exists "Users can create submissions" on public.submissions;
drop policy if exists "Admins can view all submissions" on public.submissions;
drop policy if exists "Users can manage own progress" on public.user_progress;
drop policy if exists "Admins can view all progress" on public.user_progress;

-- Включаем RLS обратно
alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.submissions enable row level security;
alter table public.user_progress enable row level security;

-- Политики для profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Разрешаем вставку через триггер (важно!)
create policy "Enable insert for authenticated users only" on public.profiles
  for insert with check (auth.role() = 'authenticated');

-- Политики для modules
create policy "Anyone can view published modules" on public.modules
  for select using (is_published = true);

create policy "Admins can manage modules" on public.modules
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Политики для lessons
create policy "Anyone can view lessons in published modules" on public.lessons
  for select using (
    exists (select 1 from public.modules where id = lessons.module_id and is_published = true)
  );

create policy "Admins can manage lessons" on public.lessons
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Политики для submissions
create policy "Users can view own submissions" on public.submissions
  for select using (auth.uid() = user_id);

create policy "Users can create submissions" on public.submissions
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all submissions" on public.submissions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Политики для user_progress
create policy "Users can view own progress" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "Users can manage own progress" on public.user_progress
  for all using (auth.uid() = user_id);

create policy "Admins can view all progress" on public.user_progress
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );