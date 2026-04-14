# Análise Competitiva — Videomnix
> Gerado em: abril 2026
> Concorrentes analisados: Deep Video (engenharia reversa de reel Facebook) + DeeVid AI (deevid.ai/pt)
> Contexto: Videomnix MVP — Motor Dark Channel (YouTube automático) + Motor UGC (avatar + Instagram/TikTok)

---

## PARTE 1 — Deep Video vs Videomnix

### Fonte da análise
Engenharia reversa de reel de 52s no Facebook demonstrando o Deep Video em funcionamento.
Pipeline interno detectado frame a frame — não declarado oficialmente pela empresa.

---

### 1.1 Onde o Videomnix é superior

**Upload automático para YouTube**
O Deep Video entrega o arquivo de vídeo — o usuário ainda precisa abrir o YouTube Studio e fazer o upload manualmente. O Videomnix fecha o loop: do tópico ao vídeo publicado sem intervenção humana. Para quem opera 3 canais com 4 vídeos por semana, isso é a diferença entre 6 horas semanais de trabalho manual e zero.

**Motor de trending topics automático**
O Deep Video exige que o usuário pense no tema e digite o prompt. O Videomnix identifica automaticamente o que está em alta no nicho via `fetch-trending` e gera o vídeo sobre o tópico certo no momento certo — antes da janela de interesse fechar. Isso é a diferença entre um canal que cresce organicamente e um canal que publica no escuro.

**Gestão de múltiplos canais**
O Deep Video não tem o conceito de "canal persistente". Cada geração é independente. No Videomnix o usuário configura o canal uma vez (nicho, voz, estilo, horário) e o sistema roda sozinho indefinidamente. Um usuário Pro com 5 canais produz 100 vídeos/mês sem abrir o app.

**Motor UGC — avatar do próprio influenciador**
O Deep Video é 100% dark channel. O Videomnix resolve também o influenciador que quer aparecer sem gravar toda vez, via avatar DUIX HeyGem treinado no rosto real do criador + voz clonada ElevenLabs. São dois produtos em um.

**Analytics de performance integrado**
O Videomnix sincroniza com a YouTube Analytics API e exibe RPM, views, retenção e CTR por vídeo dentro do painel. O Deep Video não tem nenhuma métrica pós-publicação — o criador não sabe o que funcionou.

**Geração de Shorts automática**
O pipeline do Videomnix inclui uma etapa dedicada de corte 9:16 (`generate-shorts`) que gera automaticamente a versão Shorts de cada vídeo longo. O Deep Video não faz isso.

**Foco brasileiro**
Deep Video é produto americano: interface em inglês, footage de arquivo em inglês, sem suporte a nichos BR. O Videomnix é construído para o criador brasileiro — nichos em PT-BR, vozes nativas, pagamento via Kiwify/PIX.

---

### 1.2 O que aproveitar do Deep Video

| Feature | Descrição | Complexidade | Onde encaixa no pipeline | Impacto |
|---------|-----------|:------------:|--------------------------|:-------:|
| **Approve Script button** | Usuário revisa e aprova o roteiro antes de disparar geração de áudio/vídeo. Evita desperdício de créditos em roteiros ruins. | Baixa | Entre etapa 2 (generate-script) e etapa 3 (generate-voice). Novo status `awaiting_approval` no `content_queue`. | 9/10 |
| **Input por link YouTube** | Usuário cola link de um vídeo de referência; plataforma extrai a transcrição e usa como base do roteiro. Permite replicar vídeos de sucesso. | Baixa | Modo alternativo no `fetch-trending` — além do trending automático. db8-agent já tem web fetch. | 8/10 |
| **Motion graphics como fallback** | Quando não há footage relevante disponível, gera motion graphics animados (mapas, fumaça, gráficos) em vez de falhar a geração. | Média | Etapa 4 (generate-video) — condição: `if footage_found == false → generate_motion_graphics via Fal.ai` | 7/10 |

---

### 1.3 Ações prioritárias — próximos 60 dias

**Prioridade 1 — Tela de aprovação de script**
Adicionar status `awaiting_approval` no `content_queue` entre as etapas 2 e 3. Criar página `/videos/[id]/review` com o roteiro completo, campo de edição e botão "Aprovar e Gerar". Menos de 1 dia de desenvolvimento, impacto direto na satisfação e retenção.

**Prioridade 2 — Adicionar nichos história e notícias/economia**
O Deep Video demonstra exatamente esses dois nichos (WWII, mercado imobiliário Florida) porque são os de maior tração no YouTube em inglês — e estão subexplorados em português. Editar `src/lib/niche-config.ts` adicionando `historia` e `noticias_economia`. 2 horas de trabalho.

**Prioridade 3 — Input por link de referência**
Além do trending automático, permitir que o usuário cole um link YouTube de um vídeo que quer replicar/inspirar. O db8-agent extrai a transcrição via YouTube Transcript API e usa como contexto do `generate-script`. Expande o caso de uso enormemente.

**Prioridade 4 — Demo video do produto**
Criar o vídeo de demonstração no mesmo formato do reel analisado: split screen mostrando o pipeline rodando em 52 segundos, CTA "Comenta CANAL". Esse vídeo é o principal ativo de aquisição orgânica — sem ele a landing page não converte.

**Prioridade 5 — Posicionar "do tópico ao publicado" na landing page**
O Deep Video para no vídeo gerado. Isso precisa estar na headline do Videomnix: *"Seu canal no YouTube no automático — do tópico ao vídeo publicado, sem editar nada."* O diferencial da publicação automática não está claro no produto hoje.

---

## PARTE 2 — DeeVid AI vs Videomnix

### Fonte da análise
Levantamento completo de deevid.ai/pt: landing page, página de preços, features declaradas, casos de uso promovidos, modelos disponíveis.

---

### 2.1 Onde o Videomnix ganha

**Pipeline completo integrado — do roteiro à publicação**
O DeeVid gera clips isolados. O usuário ainda precisa escrever o roteiro, gravar ou sintetizar a narração, editar, e publicar manualmente. O Videomnix faz tudo isso em sequência automática. São categorias de produto diferentes: o DeeVid é uma ferramenta; o Videomnix é um sistema.

**Upload automático para YouTube e Instagram**
O DeeVid não publica nada — você baixa o arquivo e sobe manualmente. O Videomnix publica direto nas plataformas. Para escala, isso é insubstituível.

**Trending topics por nicho automático**
O DeeVid não tem inteligência sobre o que está em alta. O usuário define o prompt do zero. O Videomnix identifica os tópicos com maior potencial de alcance no nicho antes de gerar.

**Gestão de canais persistentes**
No DeeVid cada geração é isolada. No Videomnix o canal tem identidade própria: nicho, voz, estilo, horário de postagem, histórico de métricas. O sistema aprende o que funciona no canal.

**Analytics de performance pós-publicação**
O DeeVid não acompanha o que acontece depois da geração. O Videomnix sincroniza RPM, views, retenção e CTR do YouTube — o criador sabe o que funcionou e o sistema pode ajustar.

**Motor UGC com avatar treinado no rosto real**
O DeeVid tem "Avatar IA" genérico nos planos pagos — avatares pré-fabricados. O Videomnix treina o avatar a partir de 10 segundos de vídeo do próprio influenciador via DUIX HeyGem. É o rosto real da pessoa, não um personagem genérico.

**Foco no criador brasileiro**
DeeVid é global genérico. Interface traduzida automaticamente, sem foco em nichos BR, sem pagamento nacional. O Videomnix é construído do zero para o mercado brasileiro.

---

### 2.2 Onde o DeeVid ganha hoje

| Vantagem | Impacto na aquisição do Videomnix |
|---------|----------------------------------|
| **Freetrial sem cartão (20 créditos = 4 vídeos)** | Alto — o criador quer ver funcionando antes de pagar. Sem trial, o Videomnix perde usuários no topo do funil para quem oferece teste real. |
| **App mobile iOS + Android** | Médio — criadores brasileiros vivem no celular. Sem app, o Videomnix fica fora do fluxo de uso do criador mobile-first. |
| **Escolha de modelo (Kling, Sora, Veo 3.1, Runway)** | Médio — cria percepção de poder e controle. O usuário sente que está usando o estado da arte. Videomnix usa modelos fixos que o usuário não vê. |
| **Marca com 3M usuários** | Médio — prova social pesada para quem está comparando ferramentas. |
| **Geração em ~1 minuto** | Baixo — o pipeline do Videomnix leva mais tempo por ser mais completo, mas pode ser percebido como lentidão. |

---

### 2.3 O que aproveitar do DeeVid

**Freetrial sem cartão**
3 vídeos grátis no signup, sem cartão de crédito. No stack atual: coluna `free_videos_used` na tabela `users` + verificação no middleware antes de chamar o db8-agent. Se `free_videos_used >= 3 AND plan == 'trial' AND card_on_file == false` — bloquear e redirecionar para plano. Complexidade baixa. Impacto alto — remove a principal barreira de aquisição.

**Transparência de modelo durante o pipeline**
Não precisa dar controle total, mas mostrar na tela de progresso: "Gerando roteiro com Claude Sonnet", "Criando narração com ElevenLabs", "Renderizando com Fal.ai Flux Pro". Isso cria percepção de qualidade e diferencia de soluções black-box. É pura UI — complexidade baixa, impacto médio na percepção de valor.

**App mobile (PWA primeiro)**
Para V2: Progressive Web App instalável no celular antes de um app nativo. O painel do Videomnix já é responsivo com shadcn/ui — transformar em PWA é adicionar `manifest.json` + service worker. Complexidade baixa. App nativo React Native fica para V3.

**Programa de afiliados**
O DeeVid tem página de afiliados (`/affiliate`). Para um produto no mercado BR de criadores de conteúdo, afiliados são o canal de distribuição mais eficiente — criadores indicam para criadores. Implementar via Kiwify (já integrado) que tem sistema de afiliados nativo. Complexidade zero adicional.

---

### 2.4 Posicionamento — atacar o segmento descoberto

O DeeVid ataca **"gere um clipe"**. O Videomnix ataca **"tenha um canal que cresce sozinho"**.

São públicos diferentes que se comunicam de forma diferente:

| | DeeVid | Videomnix |
|--|--------|-----------|
| Quem é | Criador que quer um vídeo agora | Criador que quer renda passiva com canal |
| Problema | "Preciso de um vídeo para hoje" | "Não tenho tempo de criar todo dia" |
| Resultado | Um clip gerado | Um canal publicando automaticamente |
| Concorrente real | Canva, CapCut, Adobe Express | O próprio trabalho manual do criador |

**Headline recomendada para landing page:**
> *"Seu canal no YouTube no automático. Do tópico ao vídeo publicado — sem gravar, sem editar, sem aparecer."*

**Mensagem para anúncios:**
> *"Enquanto você dorme, seu canal publica. O Videomnix encontra os tópicos em alta, escreve o roteiro, narra, edita e publica. Você só assiste as views crescerem."*

---

### 2.5 Roadmap de diferenciação sustentável

Features que o DeeVid não consegue copiar facilmente por modelo de negócio:

**1. Aprovação de script antes de gerar**
O DeeVid é geração pontual — não tem o conceito de pipeline com etapas aprovadas pelo usuário. Implementar no Videomnix cria um fluxo de controle que diferencia de todas as ferramentas de geração rápida.

**2. Analytics de canal dentro do app**
RPM, views, retenção, CTR por vídeo, evolução do canal ao longo do tempo. O DeeVid nunca terá isso porque não publica nada. É uma vantagem estrutural permanente.

**3. Agendamento automático por horário de pico do nicho**
O sistema detecta o melhor horário para publicar no nicho específico (ex: vídeos de finanças performam melhor às 19h de terça) e agenda automaticamente. Nenhum concorrente de geração de vídeo faz isso porque nenhum deles publica.

**4. Biblioteca de nichos com persona de canal configurada**
Cada nicho tem voz padrão, estilo de edição, tipo de hook, música de fundo e persona do narrador pré-configurados. O criador escolhe "Canal de Curiosidades" e já tem tudo pronto — identidade visual, voz, estilo. DeeVid é completamente genérico, sem memória de nicho.

**5. Motor UGC com avatar treinado no rosto real**
Isso posiciona o Videomnix além do dark channel e entra no mercado de influenciadores. Avatar genérico o DeeVid tem. Avatar treinado com 10 segundos do seu rosto real, com sua voz clonada, publicando no seu Instagram — isso é outra categoria. E é o diferencial que nenhum concorrente de automação de canal possui.

---

## Resumo Executivo

### O que o Videomnix é
Um sistema de automação de canal, não um gerador de vídeos. Essa distinção define o posicionamento, o público e o roadmap.

### Os 3 gaps que precisam ser fechados agora
1. **Freetrial sem cartão** — barreira de aquisição crítica, 2h de desenvolvimento
2. **Tela de aprovação de script** — feature de retenção e confiança, 1 dia de desenvolvimento
3. **Nichos história + notícias/economia** — expansão de mercado, 2h de desenvolvimento

### A vantagem competitiva sustentável
Nenhum concorrente fecha o loop completo: tópico em alta → roteiro → voz → vídeo → publicação → analytics. O Videomnix é o único sistema que faz isso em português para o mercado brasileiro. Essa é a vantagem que não pode ser copiada por ferramentas de geração pontual.
