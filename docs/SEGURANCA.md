# Segurança

Este projeto começa com segurança como regra central, não como ajuste posterior.

## Regras obrigatórias

- Nunca usar `service_role` no frontend.
- Nunca confiar em `company_id` enviado pelo navegador.
- Toda tabela operacional deve ter RLS ativado.
- Toda consulta deve ser validada também pelo banco, não apenas pela tela.
- A sessão deve ser validada no servidor antes de carregar páginas internas.
- Redirecionamentos após login precisam aceitar apenas caminhos internos.

## Modelo de isolamento

O usuário pertence a uma empresa por meio da tabela `profiles`.

As tabelas operacionais têm `company_id`.

As políticas RLS comparam:

```sql
company_id = public.current_company_id()
```

Isso impede que um usuário de uma empresa veja dados de outra, mesmo que tente manipular requisições pelo navegador.

## Modelo de permissão inicial

- `admin`: pode administrar cadastros operacionais da empresa.
- `manager`: pode administrar cadastros operacionais da empresa.
- `member`: pode visualizar dados da empresa e criar tarefas.

Pendências fixas, processos, unidades e modelos de checklist são tratados como cadastros sensíveis. No MVP, a escrita desses dados fica restrita a `admin` e `manager`.

Tarefas e compromissos de agenda podem ser criados por usuários autenticados da empresa. Edição fica limitada ao criador, responsável ou a perfis de gestão.

## Antes de criar nova funcionalidade

1. Conferir se a tabela tem `company_id`.
2. Conferir se a tabela tem RLS.
3. Conferir se existe política `using` e `with check`.
4. Conferir se a tela não expõe dados sensíveis.
5. Conferir se a ação de escrita roda no servidor.
6. Conferir se o usuário autenticado tem permissão.
7. Conferir se vínculos como responsável, unidade, tarefa e pendência pertencem à mesma empresa.
8. Conferir se registros com autoria usam `created_by = auth.uid()` nas políticas RLS.
9. Conferir se usuários comuns não conseguem alterar campos sensíveis por API direta do Supabase.
