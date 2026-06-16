# Setup do Supabase

## 1. Criar projeto

Crie um projeto no Supabase e copie:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Essas chaves entram no `.env.local`.

## 2. Executar estrutura do banco

No SQL Editor do Supabase, execute o arquivo:

```text
supabase/schema.sql
```

## 3. Criar usuário

No painel do Supabase:

1. Abra Authentication.
2. Crie o usuário com e-mail e senha.
3. Copie o `User UID`.

## 4. Criar empresa e perfil inicial

Execute no SQL Editor, trocando os valores indicados:

```sql
insert into public.companies (name)
values ('Hector Studios')
returning id;
```

Depois use o `id` retornado como `company_id`:

```sql
insert into public.profiles (id, company_id, full_name, role)
values (
  'USER_UID_DO_SUPABASE',
  'COMPANY_ID_RETORNADO',
  'Nome do usuário',
  'admin'
);
```

## 5. Criar unidades/casas iniciais

```sql
insert into public.units (company_id, name, city)
values
  ('COMPANY_ID_RETORNADO', 'Hector Pizzaria', 'Gramado'),
  ('COMPANY_ID_RETORNADO', 'Ferrovia Secreta', 'Canela');
```

## Observação de segurança

Não coloque a chave `service_role` no `.env.local` do frontend. Para este projeto, o navegador usa apenas a chave pública `anon`, e o isolamento real acontece pelas políticas RLS.
