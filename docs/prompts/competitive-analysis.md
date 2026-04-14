# Prompts — Análise Competitiva Videomnix
> Usar no Claude Code, db8-agent ou AI Studio (Gemini 2.5 Pro, temp 0.3)

---

## PROMPT 1 — Deep Video vs Videomnix

```
Você é o arquiteto de produto do Videomnix — SaaS brasileiro de geração
automática de vídeos para YouTube e Instagram, com dois motores:
Motor Dark Channel (faceless/anônimo) e Motor UGC (avatar próprio).

Analise o comparativo abaixo e responda as 3 perguntas estratégicas.

PIPELINE DEEP VIDEO (detectado via engenharia reversa):
  Input: link YouTube como fonte + prompt de tema
  1. Geração de roteiro por seções (intro / sections / outro / script / narration / voiceover)
  2. Usuário aprova o script ("Approve Script" button)
  3. Busca visuais automaticamente; fallback: motion graphics
  4. Monta timeline (Subtitles / Transition / Text / Animation / áudio)
  Output: vídeo editado e narrado — usuário faz upload manual no YouTube

PIPELINE VIDEOMNIX:
  1. fetch-trending — tópicos em alta por nicho (automático)
  2. generate-script — roteiro via Claude
  3. generate-voice — narração ElevenLabs
  4. generate-video — vídeo FFmpeg
  5. generate-thumbnail — Fal.ai
  6. generate-shorts — versão 9:16
  7. youtube-upload — publica no YouTube (automático)
  + Motor UGC: avatar próprio DUIX HeyGem + voz clonada + Instagram/TikTok

PERGUNTA 1 — Onde o Videomnix é superior? (com impacto prático por item)
PERGUNTA 2 — O que aproveitar do Deep Video? (feature / complexidade / onde encaixa / impacto 1–10)
PERGUNTA 3 — Top 5 ações prioritárias nos próximos 60 dias.
```

---

## PROMPT 2 — DeeVid AI vs Videomnix

```
Você é o arquiteto de produto do Videomnix — SaaS brasileiro de geração
automática de vídeos para YouTube e Instagram.

Analise o comparativo com o DeeVid AI e responda as 5 perguntas.

DEEVID AI (deevid.ai/pt):
  Posição: gerador pontual de clips — texto/imagem/vídeo → vídeo
  Modelos: Veo 3.1, Sora 2, Kling, Runway, Luma, Pika, Wan 2.1 (usuário escolhe)
  Planos: Lite $10 (40 vídeos) / Pro $25 (120 vídeos) / Premium $119 (600 vídeos)
  Free: 20 créditos sem cartão (~4 vídeos)
  Plataformas: Web + iOS + Android
  Usuários: 3 milhões declarados
  NÃO FAZ: upload automático, gestão de canais, trending topics,
            agendamento, analytics, pipeline integrado roteiro→publicação

VIDEOMNIX:
  Motor Dark: pipeline 7 etapas do tópico ao upload YouTube (automático)
  Motor UGC: avatar próprio + voz clonada + Instagram/TikTok
  Diferenciais: canais múltiplos, analytics YouTube, agendamento, Kiwify BR

PERGUNTA 1 — Onde o Videomnix ganha? (vantagens competitivas reais)
PERGUNTA 2 — Onde o DeeVid ganha hoje? (impacto na aquisição)
PERGUNTA 3 — O que aproveitar? (feature / contexto BR / como implementar / complexidade / impacto)
PERGUNTA 4 — Posicionamento: como atacar o segmento que o DeeVid deixa descoberto?
PERGUNTA 5 — Top 5 features para diferenciação sustentável.
```
