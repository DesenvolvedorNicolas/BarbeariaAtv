# 💈 Barbearia API

API REST de agendamentos para barbearia, com front-end simples.
**Stack:** Node.js + Express · PostgreSQL (Neon) · HTML/CSS/JS puro · Deploy na Vercel.

## Entidades

| Tabela | Campos principais |
|---|---|
| `clientes` | nome, telefone, email (único) |
| `barbeiros` | nome, especialidade, ativo |
| `servicos` | nome, preco, duracao_min |
| `agendamentos` | cliente_id, barbeiro_id, servico_id, data_hora, status, observacoes |

Relacionamentos: um agendamento pertence a **1 cliente, 1 barbeiro e 1 serviço**.
O banco impede dois agendamentos do mesmo barbeiro no mesmo horário.

## Rotas

Para cada recurso (`clientes`, `barbeiros`, `servicos`, `agendamentos`):

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/<recurso>` | Lista todos |
| GET | `/api/<recurso>/:id` | Busca um |
| POST | `/api/<recurso>` | Cria |
| PUT | `/api/<recurso>/:id` | Atualiza (campos enviados) |
| DELETE | `/api/<recurso>/:id` | Remove |

Exemplo:

```bash
curl -X POST http://localhost:3000/api/agendamentos \
  -H "Content-Type: application/json" \
  -d '{"cliente_id":1,"barbeiro_id":1,"servico_id":1,"data_hora":"2026-10-20T14:00:00-03:00"}'
```

## Rodar localmente

```bash
npm install
cp .env.example .env     # coloque sua DATABASE_URL do Neon
npm run dev              # http://localhost:3000
```

Requer Node 20+ (usa `node --env-file`).

---

## Deploy passo a passo

### 1) Neon (banco de dados)

1. Crie uma conta em https://neon.tech (pode entrar com GitHub).
2. **Create project** → nome `barbearia`, escolha a região mais próxima (ex.: `sa-east-1`, São Paulo).
3. No painel do projeto, abra **SQL Editor**, cole todo o conteúdo de `db/schema.sql` e clique em **Run**.
   Isso cria as 4 tabelas e alguns dados de exemplo.
4. Clique em **Connect** (ou "Connection Details") e copie a **connection string**
   (formato `postgresql://usuario:senha@ep-xxxx.../neondb?sslmode=require`).
5. Cole essa string no seu `.env` local (`DATABASE_URL=...`) para testar com `npm run dev`.

### 2) GitHub

```bash
git init
git add .
git commit -m "API da barbearia"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/barbearia-api.git
git push -u origin main
```

> O `.gitignore` já impede que o `.env` (com a senha do banco) suba para o GitHub.

### 3) Vercel

1. Crie uma conta em https://vercel.com (entre com GitHub).
2. **Add New → Project** → importe o repositório `barbearia-api`.
3. Em **Framework Preset** deixe **Other**. Não precisa mudar build/output.
4. Abra **Environment Variables** e adicione:
   - **Name:** `DATABASE_URL`
   - **Value:** a connection string do Neon
5. Clique em **Deploy**.
6. Ao terminar, abra a URL (`https://barbearia-api-xxxx.vercel.app`):
   - `/` → front-end
   - `/api/clientes` → JSON da API

A cada `git push` na `main`, a Vercel faz um novo deploy automaticamente.

### Alternativa via terminal

```bash
npm i -g vercel
vercel login
vercel                              # primeiro deploy (preview)
vercel env add DATABASE_URL         # cole a string do Neon
vercel --prod                       # deploy de produção
```

### Integração Vercel ↔ Neon (opcional)

No painel da Vercel: **Storage → Create/Connect Database → Neon**. A Vercel cria o banco
e injeta a variável `DATABASE_URL` sozinha no projeto. Depois é só rodar o `schema.sql` no SQL Editor do Neon.

## Problemas comuns

- **500 em todas as rotas:** `DATABASE_URL` não configurada na Vercel ou string errada. Corrija e faça **Redeploy**.
- **`relation "clientes" does not exist`:** faltou rodar o `db/schema.sql` no Neon.
- **404 em `/api/...`:** confira se o `vercel.json` está na raiz do projeto.
- **409 ao agendar:** o barbeiro já tem agendamento naquele horário.

## Estrutura

```
barbearia-api/
├── api/index.js        # API Express (função serverless na Vercel)
├── lib/db.js           # conexão com o Neon
├── db/schema.sql       # tabelas + dados de exemplo
├── public/             # front-end (index.html, style.css, app.js)
├── server.js           # servidor local
├── vercel.json         # reescreve /api/* para a função
└── package.json
```
