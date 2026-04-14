# VIDEOMNIX — PROJECT MEMORY & AGENT INSTRUCTIONS
## Versão 3.0 — Três Motores: Dark + UGC + Social

---

## O QUE É ESTE PRODUTO

SaaS completo para criadores de conteúdo brasileiros com três motores independentes:

**Motor Dark Channel** — automação de canais YouTube anônimos (faceless). Do tópico trending ao vídeo publicado sem intervenção humana.

**Motor UGC** — vídeos com avatar digital próprio do influenciador para Instagram, TikTok e YouTube. Grava 10s uma vez, o sistema gera vídeos com seu rosto para sempre.

**Motor Social** — gestão completa da carreira: CRM de marcas, pipeline de deals, inbox unificado de DMs, monitor de concorrentes e analytics consolidado. Monetização YouTube rastreada via `analytics_snapshots` (RPM, revenue_usd) — não há módulo financeiro genérico.

videomnix.com · Next.js 14 · Supabase · Vercel

---

## PLANOS

```
trial      → 7d grátis — Dark (1 canal, 5 vídeos) + Social básico (3 marcas)
starter    → R$97/mês  — Dark (2 canais, 30v/mês) + Social básico (10 marcas)
pro        → R$197/mês — Dark + UGC (1 avatar, 60v) + Social completo (ilimitado, inbox, 5 concorrentes)
enterprise → R$497/mês — Tudo ilimitado + white-label + multi-usuário + API
blocked    → zero acesso (chargeback/fraude)
```

Gate de plano: `src/lib/plans.ts` — usar em TODAS as API Routes.
Pagamentos via webhook Kiwify (`/api/webhooks/kiwify`).

---

## STACK — NUNCA ALTERAR SEM APROVAÇÃO

```
Frontend:    Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Database:    Supabase exclusivo Videomnix
Engine IA:   db8-agent Railway — https://api.db8intelligence.com.br
GPU Service: RunPod RTX 4090 — https://gpu.videomnix.com  (Motor UGC)
Automação:   n8n em automacao.db8intelligence.com.br
Deploy:      Vercel (auto-deploy do branch main)
Pagamento:   Kiwify
```

**Regras absolutas — nunca violar:**
- NUNCA chamar ElevenLabs / Fal.ai / Claude / DUIX HeyGem diretamente do Next.js
- SEMPRE via db8-agent com `X-Service-Key`
- `DB8_SERVICE_KEY` e `GPU_SERVICE_KEY` apenas em API Routes server-side
- Motor Social (CRM/inbox) chama Supabase diretamente — sem passar pelo db8-agent
- IA de legendas e roteiros do Motor Social → db8-agent `/social/generate-caption` e `/social/generate-script`

---

## ARQUITETURA — FLUXO DE CHAMADAS

```
Next.js (Vercel)
      │
      ├── Motor Dark  → db8-agent /channel/*
      │     └── ElevenLabs · FFmpeg · Fal.ai · YouTube API
      │
      ├── Motor UGC   → db8-agent /avatar/* /social/publish
      │     └── GPU Service (RunPod) · ElevenLabs · Instagram/TikTok API
      │
      └── Motor Social → Supabase direto (server-side)
            ├── CRM:          brands, deals, deal_activities
            ├── Inbox:        conversations, messages (sync via Instagram Graph API)
            ├── Concorrentes: competitors, competitor_snapshots
            ├── Analytics:    analytics_snapshots (inclui monetização YouTube)
            └── Templates:    content_templates
```

---

## BANCO DE DADOS — TODAS AS TABELAS

### Migrations 001–003 (Motor Dark — já aplicadas)
```
users · channels · content_queue · video_metrics · data_sources
VIEW: channel_performance
```

### Migration 004 (Motor UGC — aplicar)
```
subscriptions · avatars · voice_clones · social_accounts
ALTER content_queue: engine, avatar_id, voice_clone_id, social_account_id,
                     platform, scheduled_at, published_url, published_platform_id
```

### Migration 005 (Motor Social — aplicar em paralelo)
```
brands             → CRM de marcas/clientes
deals              → Pipeline kanban (8 stages)
deal_activities    → Histórico de atividades por deal
competitors        → Monitor de concorrentes
competitor_snapshots → Histórico de métricas dos concorrentes
conversations      → Inbox unificado (DMs Instagram/TikTok/YouTube)
messages           → Mensagens do inbox
analytics_snapshots → Snapshots periódicos + monetização YouTube (RPM, revenue_usd)
content_templates  → Templates de roteiro/legenda por nicho
notifications      → Notificações in-app

ALTER users: nicho, bio, website, whatsapp, timezone, avatar_url,
             followers_total, onboarding_done
ALTER social_accounts: following_count, posts_count, engagement_rate,
                       last_synced_at

FUNCTION: user_can_use_social_motor(user_id, feature)
```

### Status flow content_queue
```
Motor Dark: pending → scripted → voiced → rendered → thumbnailed → ready → posted → failed
Motor UGC:  pending → scripted → voiced → avatar_generating → avatar_ready → formatting → ready → scheduled → posted → failed
```

---

## PIPELINE MOTOR DARK (existente)

```
1. /api/db8/fetch-trending      → tópicos em alta  → INSERT content_queue (pending)
2. /api/db8/generate-script     → roteiro Claude   → UPDATE (scripted)
3. /api/db8/generate-voice      → ElevenLabs       → UPDATE (voiced)
4. /api/db8/generate-video      → FFmpeg           → UPDATE (rendered)
5. /api/db8/generate-thumbnail  → Fal.ai           → UPDATE (thumbnailed)
6. /api/db8/generate-shorts     → FFmpeg crop      → UPDATE (ready)
7. /api/youtube/upload          → YouTube          → UPDATE (posted)
```

---

## PIPELINE MOTOR UGC (em implementação)

```
Onboarding: upload vídeo 10-30s + fotos → POST /api/avatar/train
            → db8-agent → GPU Service (DUIX HeyGem) → avatars.status: ready

Geração: POST /api/db8/ugc/generate
         → db8-agent: ElevenLabs (voz clonada) + GPU Service (lip-sync)
         → FFmpeg: formato 9:16 ou 16:9
         → POST /api/social/publish → Instagram/TikTok/YouTube
```

---

## PIPELINE MOTOR SOCIAL (novo — implementar)

### CRM (`/api/crm/*`)
```
POST   /api/crm/brands              → criar marca (canAddBrand gate)
GET    /api/crm/brands              → listar marcas do usuário
PATCH  /api/crm/brands/[id]         → atualizar marca
DELETE /api/crm/brands/[id]         → arquivar marca

POST   /api/crm/deals               → criar deal (canUseSocialFeature 'crm')
GET    /api/crm/deals               → listar deals (filtro por stage)
PATCH  /api/crm/deals/[id]          → atualizar deal / mover kanban
POST   /api/crm/deals/[id]/activity → registrar atividade
```

### Inbox (`/api/inbox/*`) — plano Pro+
```
GET    /api/inbox/conversations     → listar conversas (paginado)
GET    /api/inbox/conversations/[id]/messages → mensagens de uma conversa
POST   /api/inbox/conversations/[id]/reply    → enviar resposta
PATCH  /api/inbox/conversations/[id]          → marcar lida / arquivar
POST   /api/inbox/sync              → sincronizar DMs via Instagram Graph API
```

### Concorrentes (`/api/competitors/*`) — plano Pro+
```
POST   /api/competitors             → adicionar concorrente (canAddCompetitor gate)
GET    /api/competitors             → listar concorrentes
GET    /api/competitors/[id]/snapshots → histórico de métricas
POST   /api/competitors/snapshot    → tirar snapshot manual
```

### Analytics (`/api/analytics/*`) — plano Pro+
```
GET    /api/analytics/overview      → consolidado de todas as plataformas
GET    /api/analytics/[platform]    → métricas por plataforma
GET    /api/analytics/monetization  → RPM, revenue_usd, watch_time (YouTube)
POST   /api/analytics/sync          → sincronizar métricas (aciona n8n)
```

### IA Motor Social (via db8-agent)
```
POST /api/db8/social/generate-caption  → legenda otimizada para post
POST /api/db8/social/generate-script   → roteiro para reels/stories
POST /api/db8/social/suggest-hashtags  → sugestão de hashtags por nicho
```

---

## ROTAS — PÁGINAS COMPLETAS

### Existentes (Motor Dark)
```
/ · /login · /cadastro · /dashboard · /canais · /canais/novo
/canais/[id] · /canais/[id]/configurar · /videos · /videos/[id]
/analytics · /configuracoes
```

### Em implementação (Motor UGC)
```
/onboarding/avatar · /onboarding/voz · /dashboard/ugc
/settings/contas-sociais · /settings/avatares · /settings/plano
```

### Novas (Motor Social — implementar)
```
/crm                    → overview CRM (pipeline + últimas marcas)
/crm/marcas             → lista de marcas
/crm/marcas/[id]        → detalhe da marca + histórico de deals
/crm/deals              → kanban de negociações (8 colunas)
/inbox                  → inbox unificado de DMs
/concorrentes           → dashboard de concorrentes
/concorrentes/[id]      → detalhe + histórico de snapshots
/analytics/social       → analytics consolidado de redes sociais
/analytics/monetizacao  → RPM e receita YouTube
/templates              → biblioteca de templates de conteúdo
```

---

## FEATURE GATES — USO OBRIGATÓRIO EM API ROUTES

```typescript
// Motor Dark
import { canCreateChannel, canTriggerPipeline } from '@/lib/plans'

// Motor UGC
import { canUseUGC, canTrainAvatar } from '@/lib/plans'

// Motor Social
import { canUseSocialFeature, canAddBrand, canAddCompetitor } from '@/lib/plans'

// Padrão de uso em qualquer API Route:
const check = await canTriggerPipeline(session.user.id)
if (!check.allowed) {
  return NextResponse.json({ error: check.reason }, { status: 403 })
}
```

---

## VARIÁVEIS DE AMBIENTE

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# db8-agent
DB8_AGENT_URL=https://api.db8intelligence.com.br
DB8_SERVICE_KEY=

# GPU Service (Motor UGC)
GPU_SERVICE_URL=https://gpu.videomnix.com
GPU_SERVICE_KEY=

# YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=/api/youtube/auth/callback

# Instagram Graph API (Motor UGC + Motor Social Inbox)
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=/api/instagram/auth/callback

# TikTok Business API (Motor UGC)
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=/api/tiktok/auth/callback

# n8n
N8N_WEBHOOK_TOKEN=
N8N_BASE_URL=https://automacao.db8intelligence.com.br

# Kiwify
KIWIFY_WEBHOOK_TOKEN=
KIWIFY_SECRET_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Videomnix
```

---

## NICHOS SUPORTADOS

```
Motor Dark:   ia_tech · financas · curiosidades · horror · motivacional
              historia · noticias_economia  ← NOVOS (adicionar niche-config.ts)
Motor UGC:    qualquer nicho (definido pelo influenciador)
Motor Social: qualquer nicho
```

---

## REGRAS DE DESENVOLVIMENTO

- TypeScript estrito — nunca usar `any`
- Server Components por padrão — `use client` só quando necessário
- Supabase queries no servidor via `createClient()` de `lib/supabase/server.ts`
- NUNCA expor `DB8_SERVICE_KEY`, `GPU_SERVICE_KEY` ou tokens OAuth no cliente
- Motor Social não passa pelo db8-agent — query Supabase diretamente no server
- IA no Motor Social (legendas, roteiros) → db8-agent `/social/*` — nunca direto
- Tokens OAuth de redes sociais: criptografar antes de salvar
- Dados biométricos (avatar, voz): `consent_confirmed = true` obrigatório
- Feature gate (`plans.ts`) em TODAS as API Routes antes de processar
- Loading states e error handling em todas as operações
- Toast notifications em operações do usuário (sonner)
- Rate limiting em endpoints que chamam APIs externas

---

## COMANDOS

```bash
npm run dev          → http://localhost:3000
npm run build        → verificar erros TypeScript antes de commitar
npx supabase db push → aplicar migrations 004 e 005
git push origin main → deploy automático Vercel
```

---

## CHECKLIST PRÉ-COMMIT

```
[ ] npm run build sem erros TypeScript
[ ] Nenhuma chave secreta no cliente
[ ] Feature gate (plans.ts) em todas as novas API Routes
[ ] Tokens OAuth criptografados no banco
[ ] RLS ativo em todas as tabelas novas
[ ] consent_confirmed verificado antes de upload avatar/voz
[ ] Loading + error states implementados
[ ] Toast em operações do usuário
[ ] .env.example atualizado com novas variáveis
[ ] Rate limiting em endpoints externos
```

---

## HISTÓRICO DE VERSÕES

```
v1.0 — Motor Dark Channel (canais YouTube automáticos)
v2.0 — Motor UGC (avatar DUIX HeyGem + voz ElevenLabs + Instagram/TikTok)
v3.0 — Motor Social (CRM + Deals Kanban + Inbox + Concorrentes + Analytics)
       migration 005 · plans.ts unificado · 3 motores · 1 SaaS
       sem módulo financeiro genérico — monetização YouTube via analytics_snapshots
```
