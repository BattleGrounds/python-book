-- Исправление политик для админов

-- Удаляем старую политику для админов на просмотр профилей (может конфликтовать)
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Создаем улучшенную политику для админов на просмотр всех профилей
-- Используем security definer функцию для обхода циклической зависимости
create or replace function public.is_admin()
returns boolean as $$
begin
  -- Используем прямой запрос к auth.users для проверки, чтобы избежать циклической зависимости
  -- Проверяем через raw_user_meta_data или через прямой запрос к profiles с security definer
  return exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- Политика для админов на просмотр всех профилей (включая свой)
-- Сначала проверяем свой профиль, потом админский доступ
create policy "Admins can view all profiles" on public.profiles
  for select using (
    auth.uid() = id OR public.is_admin()
  );

-- Политика для админов на просмотр всех модулей (включая неопубликованные)
create policy "Admins can view all modules" on public.modules
  for select using (public.is_admin());

-- Политика для админов на просмотр всех уроков
create policy "Admins can view all lessons" on public.lessons
  for select using (public.is_admin());

