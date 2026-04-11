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

## BANCO DE DADOS — TABELAS
users          → criadores solo (auth_id → auth.users)
channels       → canais YouTube por usuário
content_queue  → fila de produção (status flow completo)
video_metrics  → métricas sync da YouTube Analytics API
data_sources   → fontes de dados configuradas por canal
VIEW: channel_performance → agregado por canal

## RLS
Todas as tabelas têm RLS ativo.
Helper: get_user_id() → retorna users.id pelo auth.uid()
Sempre filtrar por user_id nas queries — RLS resolve automaticamente.

## NICHOS SUPORTADOS
ia_tech · financas · curiosidades · horror · motivacional
Config em: src/lib/niche-config.ts

## PIPELINE DE PRODUÇÃO (sequência obrigatória)
1. /api/db8/fetch-trending     → busca tópicos → INSERT content_queue (pending)
2. /api/db8/generate-script    → roteiro Claude → UPDATE queue (scripting→scripted)
3. /api/db8/generate-voice     → ElevenLabs → upload Storage → UPDATE (voiced)
4. /api/db8/generate-video     → FFmpeg → upload Storage → UPDATE (rendered)
5. /api/db8/generate-thumbnail → Fal.ai → UPDATE (thumbnailed)
6. /api/db8/generate-shorts    → FFmpeg crop → upload Storage → UPDATE (ready)
7. /api/youtube/upload         → YouTube API → UPDATE (posted + youtube_video_id)

## SUPABASE STORAGE BUCKETS (criar antes de usar)
channel-audio   → MP3 narração ElevenLabs
channel-videos  → MP4 vídeos finais
channel-shorts  → MP4 shorts 9:16
(thumbnails ficam no CDN do Fal.ai — não precisam de bucket)

## REGRAS DE DESENVOLVIMENTO
- TypeScript estrito — nunca usar any
- Server Components por padrão — 'use client' apenas quando necessário
- Supabase queries no servidor via createClient() de lib/supabase/server.ts
- NUNCA expor DB8_SERVICE_KEY no cliente — apenas em API Routes server-side
- NUNCA chamar db8-agent diretamente de componentes cliente
- Loading states em todas as queries
- Error handling em todas as chamadas ao db8-agent

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
[ ] .env.example atualizado se novas variáveis foram adicionadas
