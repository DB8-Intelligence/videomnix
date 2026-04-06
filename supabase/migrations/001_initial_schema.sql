-- ChannelOS · Schema inicial
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id         uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text        UNIQUE NOT NULL,
  name            text,
  plan            text        DEFAULT 'trial',
  channels_limit  integer     DEFAULT 2,
  videos_per_month integer    DEFAULT 30,
  trial_ends_at   timestamptz DEFAULT (now() + interval '14 days'),
  whatsapp        text,
  timezone        text        DEFAULT 'America/Sao_Paulo',
  onboarding_done boolean     DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE channels (
  id                  uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid    REFERENCES users(id) ON DELETE CASCADE,
  name                text    NOT NULL,
  niche               text    NOT NULL,
  language            text    DEFAULT 'pt-BR',
  youtube_channel_id  text,
  youtube_oauth       jsonb,
  voice_id            text,
  template_style      text    DEFAULT 'default',
  videos_per_week     integer DEFAULT 4,
  posting_times       text[]  DEFAULT ARRAY['09:00', '18:00'],
  rpm_avg             numeric(8,2) DEFAULT 0,
  total_views         bigint  DEFAULT 0,
  total_videos        integer DEFAULT 0,
  is_active           boolean DEFAULT true,
  config              jsonb   DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE content_queue (
  id                  uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id          uuid    REFERENCES channels(id) ON DELETE CASCADE,
  user_id             uuid    REFERENCES users(id) ON DELETE CASCADE,
  status              text    DEFAULT 'pending',
  topic               text    NOT NULL,
  source_type         text,
  source_url          text,
  source_raw          text,
  script              text,
  title               text,
  title_variants      text[],
  description         text,
  tags                text[],
  thumbnail_prompt    text,
  scene_descriptions  text[],
  shorts_hooks        text[],
  audio_url           text,
  video_url           text,
  thumbnail_url       text,
  shorts_urls         text[],
  youtube_video_id    text,
  youtube_shorts_ids  text[],
  scheduled_at        timestamptz,
  posted_at           timestamptz,
  retry_count         integer DEFAULT 0,
  error_log           text,
  cost_usd            numeric(8,4) DEFAULT 0,
  tokens_used         integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE video_metrics (
  id                uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id        uuid    REFERENCES content_queue(id) ON DELETE CASCADE,
  channel_id        uuid    REFERENCES channels(id) ON DELETE CASCADE,
  user_id           uuid    REFERENCES users(id) ON DELETE CASCADE,
  youtube_video_id  text    NOT NULL,
  views             bigint  DEFAULT 0,
  likes             integer DEFAULT 0,
  comments          integer DEFAULT 0,
  shares            integer DEFAULT 0,
  watch_time_min    numeric DEFAULT 0,
  avg_view_pct      numeric(5,2) DEFAULT 0,
  impressions       bigint  DEFAULT 0,
  ctr               numeric(5,4) DEFAULT 0,
  revenue_usd       numeric(10,4) DEFAULT 0,
  rpm               numeric(8,2) DEFAULT 0,
  synced_at         timestamptz DEFAULT now()
);

CREATE TABLE data_sources (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id      uuid    REFERENCES channels(id) ON DELETE CASCADE,
  name            text    NOT NULL,
  type            text    NOT NULL,
  url             text    NOT NULL,
  fetch_frequency text    DEFAULT '6h',
  keywords_filter text[],
  min_score       integer DEFAULT 0,
  last_fetched    timestamptz,
  last_item_id    text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

CREATE VIEW channel_performance AS
  SELECT
    c.id,
    c.name,
    c.niche,
    c.language,
    c.user_id,
    COUNT(DISTINCT cq.id)           AS total_videos,
    COUNT(DISTINCT cq.id)
      FILTER (WHERE cq.status = 'posted') AS posted_videos,
    COALESCE(SUM(vm.views), 0)      AS total_views,
    COALESCE(SUM(vm.revenue_usd), 0) AS total_revenue_usd,
    COALESCE(AVG(vm.rpm), 0)        AS avg_rpm,
    COALESCE(AVG(vm.avg_view_pct), 0) AS avg_retention,
    COALESCE(AVG(vm.ctr), 0)        AS avg_ctr
  FROM channels c
  LEFT JOIN content_queue cq ON cq.channel_id = c.id
  LEFT JOIN video_metrics vm ON vm.channel_id = c.id
  GROUP BY c.id, c.name, c.niche, c.language, c.user_id;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER content_queue_updated_at
  BEFORE UPDATE ON content_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS uuid AS $$
  SELECT id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
