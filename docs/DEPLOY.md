# Deploy — Supabase + Vercel

Guia para colocar o app no ar e testar na prática.
O código continua no Google Drive (backup). O Supabase guarda os dados e a Vercel roda o app.

Ordem: **1) Supabase → 2) GitHub → 3) Vercel**.

---

## 1. Supabase (banco + login)

1. Acesse https://supabase.com e crie um projeto novo (região: South America / São Paulo).
2. Abra **SQL Editor** → cole todo o conteúdo de `supabase/schema.sql` → **Run**.
   - Isso cria as tabelas, as políticas de segurança (RLS) e os gatilhos.
3. Abra **Authentication → Users → Add user** → crie seu usuário com e-mail e senha.
   - Copie o **User UID** que aparece na lista.
4. Volte ao **SQL Editor** → abra `supabase/seed.sql` e siga os 3 blocos:
   - Rode o bloco 1, **copie o `company_id`** retornado.
   - No bloco 2, troque `USER_UID_DO_SUPABASE` (o UID do passo 3) e `COMPANY_ID` (o do bloco 1) → Run.
   - No bloco 3, troque `COMPANY_ID` → Run.
5. Abra **Project Settings → API** e copie:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ⚠️ **Nunca** copie a chave `service_role` — ela não entra no app.

---

## 2. GitHub (enviar o código)

O repositório já está iniciado localmente (primeiro commit feito).

1. Crie um repositório **vazio** e **privado** em https://github.com/new
   (sem README, sem .gitignore — vazio mesmo). Anote a URL.
2. Conecte e envie (rode na pasta do projeto):

   ```bash
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git branch -M main
   git push -u origin main
   ```

   Na primeira vez o Git vai pedir login do GitHub no navegador — é normal.

---

## 3. Vercel (rodar o app)

1. Acesse https://vercel.com → **Add New → Project** → importe o repositório do GitHub.
2. Em **Environment Variables**, adicione as duas chaves do passo 1.5:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy**. Ao terminar, abra a URL gerada e faça login com o usuário do passo 1.3.

---

## Checklist de segurança antes de liberar para o time

- [ ] Só a chave `anon` (pública) está na Vercel; `service_role` nunca foi usada.
- [ ] RLS ativo em todas as tabelas (já vem do `schema.sql`).
- [ ] Cada pessoa do time tem seu próprio usuário em Authentication + perfil em `profiles`.
- [ ] Perfis criados com o `role` correto (`admin`, `manager` ou `member`).
