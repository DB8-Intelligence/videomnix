# 🎬 Videomnix

**Automação de canais dark YouTube para criadores solo brasileiros.**

Videomnix usa IA para gerar roteiros, narração, vídeos faceless e thumbnails — depois publica direto no YouTube com agendamento inteligente. Tudo sem aparecer na câmera.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres + Auth + Storage + Realtime) |
| IA Engine | [db8-agent](https://api.db8intelligence.com.br) via HTTP (X-Service-Key) |
| Automação | n8n (pipeline de produção) |
| Pagamentos | Kiwify (webhook) |
| Deploy | Vercel (auto-deploy main) |

> ⚠️ **Regra fundamental:** O Videomnix NUNCA chama APIs de IA diretamente. Toda chamada passa pelo `db8-agent` com header `X-Service-Key`.

---

## Pipeline de Produção

```
1. Buscar trending    → /api/db8/fetch-trending     → INSERT content_queue
2. Gerar roteiro      → /api/db8/generate-script     → Claude via db8-agent
3. Gerar narração     → /api/db8/generate-voice      → ElevenLabs via db8-agent
4. Gerar vídeo        → /api/db8/generate-video       → FFmpeg via db8-agent
5. Gerar thumbnail    → /api/db8/generate-thumbnail   → Fal.ai via db8-agent
6. Gerar shorts       → /api/db8/generate-shorts      → FFmpeg via db8-agent
7. Upload YouTube     → /api/youtube/upload            → YouTube Data API v3
```

---

## Nichos Suportados

| Nicho | RPM estimado (BR) |
|---|---|
| 🤖 IA & Tecnologia | R$15–45 |
| 💰 Finanças & Investimentos | R$25–80 |
| 🧠 Curiosidades & Fatos Virais | R$8–18 |
| 👻 Horror & Mistério | R$5–14 |
| ⚡ Motivacional & Superação | R$6–15 |

---

## Rotas

### Páginas (13)

| Rota | Descrição |
|---|---|
| `/` | Landing page (pública) |
| `/login` | Autenticação |
| `/cadastro` | Criação de conta |
| `/dashboard` | KPIs, canais, fila recente, widget de uso |
| `/canais` | Lista de canais |
| `/canais/novo` | Wizard 4 steps + verificação de plano |
| `/canais/[id]` | Detalhe do canal (fila + métricas) |
| `/canais/[id]/configurar` | Configurações, YouTube, excluir |
| `/videos` | Fila de produção global |
| `/videos/[id]` | Timeline, roteiro, métricas |
| `/analytics` | Gráficos RPM e Views (Recharts) |
| `/configuracoes` | Perfil, plano, timezone |

### API Routes (13)

| Rota | Rate Limit | Plan Check |
|---|---|---|
| `POST /api/db8/fetch-trending` | ✅ | ✅ |
| `POST /api/db8/generate-script` | ✅ | — |
| `POST /api/db8/generate-voice` | ✅ | — |
| `POST /api/db8/generate-video` | ✅ | — |
| `POST /api/db8/generate-thumbnail` | ✅ | — |
| `POST /api/db8/generate-shorts` | ✅ | — |
| `POST /api/channels/[id]/trigger` | ✅ | ✅ |
| `GET /api/youtube/auth` | — | — |
| `GET /api/youtube/auth/callback` | — | — |
| `POST /api/youtube/upload` | — | Token refresh |
| `POST /api/youtube/analytics` | — | Token refresh |
| `POST /api/webhooks/n8n` | — | Token auth |
| `POST /api/webhooks/kiwify` | — | Token auth |

---

## Setup Local

### Pré-requisitos
- Node.js 18+
- Projeto Supabase criado
- Acesso ao db8-agent (X-Service-Key)

### Instalação

```bash
git clone https://github.com/DB8-Intelligence/videomnix.git
cd videomnix
npm install
cp .env.example .env.local
# Preencher as variáveis em .env.local
```

### Banco de dados

Executar as migrations no SQL Editor do Supabase (em ordem):
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_fixes_p0.sql`

### Rodar

```bash
npm run dev        # http://localhost:3000
npm run build      # Verificar erros antes de commitar
```

---

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# db8-agent
DB8_AGENT_URL=https://api.db8intelligence.com.br
DB8_SERVICE_KEY=

# YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=

# n8n
N8N_WEBHOOK_TOKEN=
N8N_BASE_URL=

# Kiwify
KIWIFY_WEBHOOK_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Videomnix
```

---

## Planos

| Plano | Preço | Canais | Vídeos/mês |
|---|---|---|---|
| Trial | Grátis 14 dias | 2 | 30 |
| Starter | R$97/mês | 2 | 30 |
| Pro | R$197/mês | 5 | 100 |
| Enterprise | R$497/mês | ∞ | ∞ |

---

## Ecossistema DB8-Intelligence

| Produto | Descrição |
|---|---|
| **db8-agent** | Engine IA compartilhada (Railway/FastAPI) |
| **NexoOmnix** | Plataforma multi-nicho |
| **Videomnix** | Este produto |
| **BookAgent** | Futuro |

---

## Licença

Propriedade de DB8 Intelligence. Todos os direitos reservados.
