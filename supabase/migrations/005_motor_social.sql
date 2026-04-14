-- ============================================================
-- VIDEOMNIX · Migration 005 — Motor Social
-- CRM + Inbox + Concorrentes + Analytics + Templates + Notificações
-- SEM módulo financeiro (payments / financial_summary)
-- Executar após migrations 001–004
-- npx supabase db push
-- ============================================================

-- ============================================================
-- 1. AMPLIAR USERS — perfil do influenciador
-- ============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nicho          text,
  ADD COLUMN IF NOT EXISTS bio            text,
  ADD COLUMN IF NOT EXISTS website        text,
  ADD COLUMN IF NOT EXISTS whatsapp       text,
  ADD COLUMN IF NOT EXISTS timezone       text DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS avatar_url     text,
  ADD COLUMN IF NOT EXISTS followers_total integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_done boolean DEFAULT false;

-- ============================================================
-- 2. BRANDS — CRM de marcas/clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name        text NOT NULL,
  category    text,
  website     text,
  instagram   text,
  logo_url    text,
  description text,

  contact_name   text,
  contact_email  text,
  contact_phone  text,
  contact_role   text,

  status      text NOT NULL DEFAULT 'prospect'
    CHECK (status IN ('prospect','active','paused','closed','blocked')),

  -- Totais calculados (atualizados por trigger quando deal fecha)
  total_deals     integer DEFAULT 0,
  total_revenue   numeric(12,2) DEFAULT 0,
  avg_deal_value  numeric(12,2) DEFAULT 0,

  tags        text[] DEFAULT '{}',
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_status  ON brands(user_id, status);

-- ============================================================
-- 3. DEALS — Pipeline de negociações (kanban)
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id    uuid REFERENCES brands(id) ON DELETE SET NULL,

  title       text NOT NULL,
  description text,
  value       numeric(12,2),
  currency    text DEFAULT 'BRL',

  stage       text NOT NULL DEFAULT 'prospecting'
    CHECK (stage IN (
      'prospecting','contacted','negotiating','contract',
      'production','published','paid','lost'
    )),

  deal_type   text DEFAULT 'sponsored_post'
    CHECK (deal_type IN (
      'sponsored_post','story','reel','youtube_integration',
      'ambassador','affiliate','barter','event','other'
    )),

  deliverables     jsonb DEFAULT '[]',
  start_date       date,
  deadline         date,
  published_at     timestamptz,
  payment_due      date,
  content_queue_id uuid REFERENCES content_queue(id) ON DELETE SET NULL,
  priority         text DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_user_id  ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage    ON deals(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_brand_id ON deals(brand_id);

-- ============================================================
-- 4. DEAL_ACTIVITIES — Histórico de atividades
-- ============================================================
CREATE TABLE IF NOT EXISTS deal_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type        text NOT NULL
    CHECK (type IN (
      'note','email','whatsapp','call','meeting',
      'stage_change','file','contract','payment'
    )),
  content     text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);

-- ============================================================
-- 5. COMPETITORS — Monitor de concorrentes
-- ============================================================
CREATE TABLE IF NOT EXISTS competitors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name        text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('instagram','tiktok','youtube')),
  username    text NOT NULL,
  profile_url text,
  avatar_url  text,
  niche       text,
  notes       text,

  followers_count   integer DEFAULT 0,
  avg_views         integer DEFAULT 0,
  avg_engagement    numeric(5,2) DEFAULT 0,
  posting_frequency text,

  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  UNIQUE(user_id, platform, username)
);

CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);

-- ============================================================
-- 6. COMPETITOR_SNAPSHOTS — Histórico de métricas
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id   uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  followers_count   integer,
  following_count   integer,
  posts_count       integer,
  avg_views         integer,
  avg_likes         integer,
  avg_comments      integer,
  engagement_rate   numeric(5,2),
  top_posts         jsonb DEFAULT '[]',
  snapshotted_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_comp_id
  ON competitor_snapshots(competitor_id, snapshotted_at DESC);

-- ============================================================
-- 7. CONVERSATIONS — Inbox unificado (DMs)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  social_account_id   uuid REFERENCES social_accounts(id) ON DELETE CASCADE,

  platform            text NOT NULL CHECK (platform IN ('instagram','tiktok','youtube')),
  external_thread_id  text NOT NULL,

  participant_username  text,
  participant_name      text,
  participant_avatar    text,
  participant_user_id   text,

  status    text DEFAULT 'open'
    CHECK (status IN ('open','read','archived','spam')),

  last_message_at       timestamptz,
  last_message_preview  text,
  unread_count          integer DEFAULT 0,

  brand_id  uuid REFERENCES brands(id) ON DELETE SET NULL,
  deal_id   uuid REFERENCES deals(id)  ON DELETE SET NULL,

  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  UNIQUE(user_id, platform, external_thread_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id, status, last_message_at DESC);

-- ============================================================
-- 8. MESSAGES — Mensagens do inbox
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  external_id     text,
  direction       text NOT NULL CHECK (direction IN ('incoming','outgoing')),
  content         text,
  media_urls      text[] DEFAULT '{}',
  message_type    text DEFAULT 'text'
    CHECK (message_type IN ('text','image','video','story_reply','reel_reply','other')),

  is_read    boolean DEFAULT false,
  sent_at    timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id, sent_at DESC);

-- ============================================================
-- 9. ANALYTICS_SNAPSHOTS — Métricas periódicas
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  social_account_id   uuid REFERENCES social_accounts(id) ON DELETE CASCADE,

  platform  text NOT NULL CHECK (platform IN ('instagram','tiktok','youtube')),
  period    text NOT NULL CHECK (period IN ('daily','weekly','monthly')),

  followers_count     integer DEFAULT 0,
  followers_gained    integer DEFAULT 0,
  followers_lost      integer DEFAULT 0,
  total_views         bigint  DEFAULT 0,
  total_likes         integer DEFAULT 0,
  total_comments      integer DEFAULT 0,
  total_shares        integer DEFAULT 0,
  avg_engagement_rate numeric(5,2) DEFAULT 0,
  reach               bigint  DEFAULT 0,
  impressions         bigint  DEFAULT 0,
  profile_visits      integer DEFAULT 0,

  -- YouTube específico
  watch_time_hours    numeric DEFAULT 0,
  avg_view_duration_s integer DEFAULT 0,
  revenue_usd         numeric(10,4) DEFAULT 0,  -- receita YouTube AdSense (não é módulo financeiro)
  rpm                 numeric(8,2)  DEFAULT 0,

  top_posts           jsonb DEFAULT '[]',
  snapshotted_at      timestamptz DEFAULT now(),

  UNIQUE(user_id, social_account_id, platform, period,
    date_trunc('day', snapshotted_at))
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user
  ON analytics_snapshots(user_id, platform, period, snapshotted_at DESC);

-- ============================================================
-- 10. CONTENT_TEMPLATES — Templates de roteiro/legenda
-- ============================================================
CREATE TABLE IF NOT EXISTS content_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,  -- NULL = template global

  name         text NOT NULL,
  description  text,
  platform     text CHECK (platform IN ('instagram','tiktok','youtube','all')),
  content_type text CHECK (content_type IN (
    'script','caption','hook','cta','story','reel','shorts','all'
  )),
  niche        text,
  template     text NOT NULL,
  variables    text[] DEFAULT '{}',

  is_global   boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_templates_user
  ON content_templates(user_id, platform, content_type);
CREATE INDEX IF NOT EXISTS idx_content_templates_global
  ON content_templates(is_global, platform) WHERE is_global = true;

-- ============================================================
-- 11. NOTIFICATIONS — Notificações in-app
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type        text NOT NULL CHECK (type IN (
    'deal_deadline','video_published','video_failed',
    'new_message','competitor_spike','analytics_ready','system'
  )),
  title       text NOT NULL,
  body        text,
  action_url  text,
  metadata    jsonb DEFAULT '{}',

  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- 12. RLS em todas as tabelas novas
-- ============================================================
ALTER TABLE brands               ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals                ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'brands_own' AND tablename = 'brands') THEN
    CREATE POLICY "brands_own" ON brands FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deals_own' AND tablename = 'deals') THEN
    CREATE POLICY "deals_own" ON deals FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deal_activities_own' AND tablename = 'deal_activities') THEN
    CREATE POLICY "deal_activities_own" ON deal_activities FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'competitors_own' AND tablename = 'competitors') THEN
    CREATE POLICY "competitors_own" ON competitors FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'competitor_snapshots_own' AND tablename = 'competitor_snapshots') THEN
    CREATE POLICY "competitor_snapshots_own" ON competitor_snapshots FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversations_own' AND tablename = 'conversations') THEN
    CREATE POLICY "conversations_own" ON conversations FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'messages_own' AND tablename = 'messages') THEN
    CREATE POLICY "messages_own" ON messages FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analytics_snapshots_own' AND tablename = 'analytics_snapshots') THEN
    CREATE POLICY "analytics_snapshots_own" ON analytics_snapshots FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_own' AND tablename = 'notifications') THEN
    CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_own_or_global' AND tablename = 'content_templates') THEN
    CREATE POLICY "templates_own_or_global" ON content_templates
      FOR SELECT USING (user_id = get_user_id() OR is_global = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_own_write' AND tablename = 'content_templates') THEN
    CREATE POLICY "templates_own_write" ON content_templates
      FOR INSERT WITH CHECK (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_own_update' AND tablename = 'content_templates') THEN
    CREATE POLICY "templates_own_update" ON content_templates
      FOR UPDATE USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_own_delete' AND tablename = 'content_templates') THEN
    CREATE POLICY "templates_own_delete" ON content_templates
      FOR DELETE USING (user_id = get_user_id());
  END IF;
END $$;

-- ============================================================
-- 13. TRIGGERS updated_at
-- ============================================================
DROP TRIGGER IF EXISTS trg_brands_updated_at ON brands;
CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_competitors_updated_at ON competitors;
CREATE TRIGGER trg_competitors_updated_at
  BEFORE UPDATE ON competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_content_templates_updated_at ON content_templates;
CREATE TRIGGER trg_content_templates_updated_at
  BEFORE UPDATE ON content_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 14. TRIGGER — atualizar totais em brands quando deal fecha
-- ============================================================
CREATE OR REPLACE FUNCTION update_brand_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'paid' AND (OLD.stage IS NULL OR OLD.stage != 'paid') THEN
    UPDATE brands SET
      total_deals    = total_deals + 1,
      total_revenue  = total_revenue + COALESCE(NEW.value, 0),
      avg_deal_value = CASE
        WHEN (total_deals + 1) > 0
        THEN (total_revenue + COALESCE(NEW.value, 0)) / (total_deals + 1)
        ELSE 0
      END,
      updated_at = now()
    WHERE id = NEW.brand_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deal_paid_update_brand ON deals;
CREATE TRIGGER trg_deal_paid_update_brand
  AFTER INSERT OR UPDATE OF stage ON deals
  FOR EACH ROW EXECUTE FUNCTION update_brand_totals();

-- ============================================================
-- 15. FUNÇÃO — gate de plano para Motor Social
-- ============================================================
CREATE OR REPLACE FUNCTION user_can_use_social_motor(
  p_user_id uuid,
  p_feature text  -- 'crm', 'inbox', 'competitors', 'analytics', 'templates'
)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active','trial')
      AND (s.trial_ends_at IS NULL OR s.trial_ends_at > now())
      AND CASE p_feature
        WHEN 'crm'         THEN s.plan_type IN ('starter','pro','enterprise')
        WHEN 'templates'   THEN s.plan_type IN ('starter','pro','enterprise')
        WHEN 'inbox'       THEN s.plan_type IN ('pro','enterprise')
        WHEN 'competitors' THEN s.plan_type IN ('pro','enterprise')
        WHEN 'analytics'   THEN s.plan_type IN ('pro','enterprise')
        ELSE false
      END
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
COMMENT ON TABLE brands IS 'CRM de marcas/clientes. Motor Social.';
COMMENT ON TABLE deals IS 'Pipeline de negociações kanban. Motor Social.';
COMMENT ON TABLE competitors IS 'Monitor de concorrentes por plataforma. Motor Social.';
COMMENT ON TABLE conversations IS 'Inbox unificado DMs Instagram/TikTok/YouTube. Motor Social.';
COMMENT ON COLUMN analytics_snapshots.revenue_usd IS
  'Receita AdSense YouTube — dado de analytics, não módulo financeiro.';
COMMENT ON FUNCTION user_can_use_social_motor IS
  'Gate de plano Motor Social. Usar em /api/crm/*, /api/inbox/*, /api/competitors/*, /api/analytics/*.';
