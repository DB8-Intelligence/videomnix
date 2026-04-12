# VIDEOMNIX — PROJECT MEMORY & AGENT INSTRUCTIONS

## O QUE É ESTE PRODUTO
SaaS de automação de canais dark YouTube para criadores solo brasileiros.
videomnix.com · Next.js 14 · Supabase · Vercel

## STACK — NUNCA ALTERAR SEM APROVAÇÃO
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Database:  Supabase exclusivo Videomnix (não compartilhado com NexoOmnix)
Engine IA: db8-agent Railway — https://api.db8intelligence.com.br
           NUNCA chamar Anthropic/ElevenLabs/Fal.ai diretamente daqui
           SEMPRE via db8-agent com X-Service-Key
Automação: n8n em automacao.db8intelligence.com.br
Deploy:    Vercel (auto-deploy do branch main)
Pagamento: Kiwify (webhook em /api/webhooks/kiwify — configurar a posterior)

## ECOSSISTEMA DB8-INTELLIGENCE
Este produto faz parte do ecossistema:
- db8-agent    → engine compartilhada (Railway/FastAPI/Python)
- NexoOmnix    → plataforma multi-nicho (Supabase separado)
- ImobCreator  → sendo migrado para dentro do NexoOmnix
- Videomnix    → este produto (Supabase separado)
- BookAgent    → futuro

## VARIÁVEIS DE AMBIENTE
NEXT_PUBLIC_SUPABASE_URL       → Supabase exclusivo Videomnix
NEXT_PUBLIC_SUPABASE_ANON_KEY  → Supabase anon key
SUPABASE_SERVICE_ROLE_KEY      → server-side only
DB8_AGENT_URL                  → https://api.db8intelligence.com.br
DB8_SERVICE_KEY                → X-Service-Key para /channel/* endpoints
YOUTUBE_CLIENT_ID              → Google Cloud OAuth
YOUTUBE_CLIENT_SECRET          → Google Cloud OAuth
YOUTUBE_REDIRECT_URI           → /api/youtube/auth/callback
N8N_WEBHOOK_TOKEN              → valida callbacks do n8n
N8N_BASE_URL                   → URL base do n8n
KIWIFY_WEBHOOK_TOKEN           → token de validação do webhook Kiwify
NEXT_PUBLIC_APP_URL            → URL da aplicação
NEXT_PUBLIC_APP_NAME           → Nome do app (Videomnix)

## BANCO DE DADOS — TABELAS
users          → criadores solo (auth_id → auth.users)
channels       → canais YouTube por usuário
content_queue  → fila de produção (status flow completo)
video_metrics  → métricas sync da YouTube Analytics API (UNIQUE content_id)
data_sources   → fontes de dados configuradas por canal
VIEW: channel_performance → agregado por canal

## RLS
Todas as tabelas têm RLS ativo.
Helper: get_user_id() → retorna users.id pelo auth.uid()
Sempre filtrar por user_id nas queries — RLS resolve automaticamente.

## STORAGE BUCKETS
channel-audio   → MP3 narração (50MB limit)
channel-videos  → MP4 vídeos finais (500MB limit)
channel-shorts  → MP4 shorts 9:16 (100MB limit)

## NICHOS SUPORTADOS
ia_tech · financas · curiosidades · horror · motivacional
Config em: src/lib/niche-config.ts

## PLANOS
trial      → 14 dias, 2 canais, 30 vídeos/mês
starter    → R$97/mês, 2 canais, 30 vídeos/mês
pro        → R$197/mês, 5 canais, 100 vídeos/mês
enterprise → R$497/mês, ilimitados
blocked    → chargeback/fraude, 0 acesso
Gerenciados via webhook Kiwify (/api/webhooks/kiwify).

## PIPELINE DE PRODUÇÃO (sequência obrigatória)
1. /api/db8/fetch-trending     → busca tópicos → INSERT content_queue (pending)
2. /api/db8/generate-script    → roteiro Claude → UPDATE queue (scripting→voicing)
3. /api/db8/generate-voice     → ElevenLabs → upload Storage → UPDATE (rendering)
4. /api/db8/generate-video     → FFmpeg → upload Storage → UPDATE (thumbnailing)
5. /api/db8/generate-thumbnail → Fal.ai → UPDATE (shorting)
6. /api/db8/generate-shorts    → FFmpeg crop → upload Storage → UPDATE (ready)
7. /api/youtube/upload         → YouTube API → UPDATE (posted + youtube_video_id)

## ROTAS
### Páginas (13)
/                    → Landing page (pública)
/login               → Auth login
/cadastro            → Auth signup
/dashboard           → KPIs, canais, fila recente, widget de uso
/canais              → Lista de canais
/canais/novo         → Wizard 4 steps + plan check
/canais/[id]         → Detalhe canal (fila + métricas)
/canais/[id]/configurar → Config, YouTube, delete
/videos              → Fila de produção
/videos/[id]         → Timeline, roteiro, métricas
/analytics           → Gráficos RPM e Views
/configuracoes       → Perfil, plano, timezone

### API Routes (13)
POST /api/db8/fetch-trending        (rate limited, plan check)
POST /api/db8/generate-script       (rate limited)
POST /api/db8/generate-voice        (rate limited)
POST /api/db8/generate-video        (rate limited)
POST /api/db8/generate-thumbnail    (rate limited)
POST /api/db8/generate-shorts       (rate limited)
POST /api/channels/[id]/trigger     (rate limited, plan check)
GET  /api/youtube/auth
GET  /api/youtube/auth/callback
POST /api/youtube/upload            (token refresh)
POST /api/youtube/analytics         (token refresh)
POST /api/webhooks/n8n              (token auth)
POST /api/webhooks/kiwify           (token auth)

## REGRAS DE DESENVOLVIMENTO
- TypeScript estrito — nunca usar any
- Server Components por padrão — 'use client' apenas quando necessário
- Supabase queries no servidor via createClient() de lib/supabase/server.ts
- NUNCA expor DB8_SERVICE_KEY no cliente — apenas em API Routes server-side
- NUNCA chamar db8-agent diretamente de componentes cliente
- Loading states em todas as queries
- Error handling em todas as chamadas ao db8-agent
- Toast notifications em operações do usuário
- Rate limiting em endpoints que chamam APIs externas
- Plan enforcement antes de operações que consomem recursos

## COMANDOS
npm run dev          → servidor local http://localhost:3000
npm run build        → verificar erros antes de commitar
npx supabase db push → aplicar migrations
git push origin main → Vercel deploy automático

## CHECKLIST PRÉ-COMMIT
[ ] npm run build sem erros TypeScript
[ ] Nenhuma chave secreta exposta no código
[ ] DB8_SERVICE_KEY apenas em API Routes (server-side)
[ ] RLS não desabilitado
[ ] Loading e error states implementados
[ ] Toast notifications em operações do usuário
[ ] .env.example atualizado se novas variáveis foram adicionadas
[ ] Rate limiting em novos endpoints que chamam APIs externas
