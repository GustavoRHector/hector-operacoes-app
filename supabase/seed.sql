-- Dados iniciais da Hector Studios.
-- Execute DEPOIS de rodar schema.sql e DEPOIS de criar o usuário em Authentication.
-- Segurança: nada aqui usa service_role; o isolamento real continua nas políticas RLS.

-- 1. Cria a empresa e já guarda o id em uma variável temporária da sessão.
with nova_empresa as (
  insert into public.companies (name)
  values ('Hector Studios')
  returning id
)
select id as company_id from nova_empresa;
-- >>> Copie o company_id retornado acima e use nos dois blocos abaixo. <<<

-- 2. Vincula o usuário criado em Authentication como ADMIN.
--    Troque 'USER_UID_DO_SUPABASE' pelo User UID copiado em Authentication
--    e 'COMPANY_ID' pelo id retornado no passo 1.
insert into public.profiles (id, company_id, full_name, role)
values (
  'USER_UID_DO_SUPABASE',
  'COMPANY_ID',
  'Administrador Hector',
  'admin'
);

-- 3. Cria as unidades/casas iniciais do grupo.
--    Troque 'COMPANY_ID' pelo mesmo id do passo 1. Ajuste cidades se necessário.
insert into public.units (company_id, name, city)
values
  ('COMPANY_ID', 'Era do Fogo',      'Gramado'),
  ('COMPANY_ID', 'Hector Pizzaria',  'Gramado'),
  ('COMPANY_ID', 'Escola de Magia',  'Gramado'),
  ('COMPANY_ID', 'Ferrovia Secreta', 'Gramado');
