-- Cria automaticamente a linha em public.profiles quando um usuário se cadastra
-- pelo Supabase Auth. O nome vem do metadata enviado no signUp
-- (options.data.nome); se vier vazio, usa a parte do e-mail antes do @.
--
-- security definer é necessário porque o trigger roda no contexto do cadastro,
-- onde auth.uid() ainda não existe e as policies de profiles bloqueariam o insert.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
