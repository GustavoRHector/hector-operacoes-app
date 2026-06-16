# Continuação no Claude

Este projeto é um sistema interno da Hector Studios para rodar na Vercel com Supabase.

## Prioridade absoluta

Segurança em primeiro lugar.

Sempre que criar uma linha nova, verificar se ela:

- Não expõe dados de outra empresa.
- Não pula autenticação.
- Não confia em dados vindos do navegador.
- Não usa chave `service_role` no frontend.
- Não quebra políticas RLS.
- Não remove validações existentes.
- Não amplia permissões sem revisar impacto por perfil.
- Não confiar apenas no frontend para bloquear edição de campos sensíveis.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres com RLS
- Vercel

## Estilo de código

- Usar TypeScript estrito.
- Comentar funções com explicação simples.
- Preferir ações no servidor para escrita.
- Manter regras de segurança centralizadas.
- Evitar refatorações grandes sem necessidade.
- Toda função/componente novo deve ter comentário curto explicando sua finalidade.

## Próximos passos sugeridos

1. Instalar dependências.
2. Configurar `.env.local` com Supabase.
3. Executar `supabase/schema.sql`.
4. Criar empresa inicial, usuário e perfil.
5. Testar login.
6. Criar formulários seguros para tarefas e pendências.
7. Adicionar validação de permissão por perfil.
8. Antes de liberar CRUD completo, revisar se `admin`, `manager` e `member` têm exatamente os acessos desejados.
9. Evoluir agenda para visão mensal/semanal sem remover a proteção atual de criação/edição.

## Cuidado especial

O sistema terá dados operacionais sensíveis: documentos, vencimentos, responsáveis, processos e rotinas internas. Toda nova feature deve passar por revisão de acesso antes de ser considerada pronta.
