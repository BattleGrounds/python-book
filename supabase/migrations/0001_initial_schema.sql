-- Включаем расширения
create extension if not exists "uuid-ossp";

-- Таблица пользователей (расширяет auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Таблица модулей
create table public.modules (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  "order" integer not null,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Таблица уроков
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  "order" integer not null,
  module_id uuid references public.modules on delete cascade not null,
  exercise text, -- описание задания
  solution text, -- пример решения
  test_code text, -- код для тестирования (опционально)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Таблица отправок решений
create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  code text not null,
  passed boolean not null default false,
  output text,
  user_id uuid references public.profiles on delete cascade not null,
  lesson_id uuid references public.lessons on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Таблица прогресса пользователя
create table public.user_progress (
  id uuid default uuid_generate_v4() primary key,
  completed boolean default false,
  user_id uuid references public.profiles on delete cascade not null,
  lesson_id uuid references public.lessons on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_id)
);

-- RLS (Row Level Security)
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
create policy "Users can manage own progress" on public.user_progress
  for all using (auth.uid() = user_id);

create policy "Admins can view all progress" on public.user_progress
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );