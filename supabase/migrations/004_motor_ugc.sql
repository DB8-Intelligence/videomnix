-- ============================================================
-- VIDEOMNIX · Migration 004 — Motor UGC
-- Executar após 001 + 002 + 003 (Motor Dark)
-- npx supabase db push
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. SUBSCRIPTIONS — plano ativo por usuário
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type   text NOT NULL DEFAULT 'starter'
                CHECK (plan_type IN ('trial','starter','pro','enterprise','blocked')),
  status      text NOT NULL DEFAULT 'trial'
                CHECK (status IN ('active','trial','canceled','past_due','blocked')),
  trial_ends_at          timestamptz DEFAULT now() + INTERVAL '7 days',
  current_period_end     timestamptz,
  kiwify_subscription_id text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Auto-criar subscription no signup
CREATE OR REPLACE FUNCTION create_subscription_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'starter', 'trial')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_subscription_on_signup ON users;
CREATE TRIGGER trg_subscription_on_signup
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_subscription_on_signup();

-- ============================================================
-- 2. AVATARS — avatares digitais DUIX HeyGem (biométrico LGPD)
-- ============================================================
CREATE TABLE IF NOT EXISTS avatars (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT 'Meu Avatar',
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','training','ready','failed')),
  source_video_url    text,
  source_photos_urls  text[] DEFAULT '{}',
  heygem_avatar_id    text,
  gpu_job_id          text,
  training_started_at    timestamptz,
  training_completed_at  timestamptz,
  error_message          text,
  retry_count            integer DEFAULT 0,
  is_default  boolean DEFAULT false,
  -- LGPD Art.11: consentimento explícito obrigatório
  consent_confirmed     boolean NOT NULL DEFAULT false,
  consent_confirmed_at  timestamptz,
  consent_ip_address    text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_avatars_status  ON avatars(status);
CREATE INDEX IF NOT EXISTS idx_avatars_job_id  ON avatars(gpu_job_id)
  WHERE gpu_job_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_avatars_one_default
  ON avatars(user_id) WHERE is_default = true;

-- ============================================================
-- 3. VOICE_CLONES — clones de voz ElevenLabs (biométrico LGPD)
-- ============================================================
CREATE TABLE IF NOT EXISTS voice_clones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT 'Minha Voz',
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','ready','failed')),
  source_audio_url    text,
  elevenlabs_voice_id text,
  is_default          boolean DEFAULT false,
  error_message       text,
  consent_confirmed     boolean NOT NULL DEFAULT false,
  consent_confirmed_at  timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_clones_user_id ON voice_clones(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_clones_one_default
  ON voice_clones(user_id) WHERE is_default = true;

-- ============================================================
-- 4. SOCIAL_ACCOUNTS — contas sociais OAuth
-- ============================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform    text NOT NULL
                CHECK (platform IN ('instagram','tiktok','youtube')),
  platform_account_id  text NOT NULL,
  username             text NOT NULL,
  display_name         text,
  avatar_url           text,
  -- OAuth — NUNCA expor no cliente, apenas server-side
  access_token      text,
  refresh_token     text,
  token_expires_at  timestamptz,
  token_scope       text[],
  followers_count  integer DEFAULT 0,
  following_count  integer DEFAULT 0,
  posts_count      integer DEFAULT 0,
  engagement_rate  numeric(5,2) DEFAULT 0,
  is_active        boolean DEFAULT true,
  last_synced_at   timestamptz,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(user_id, platform, platform_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);

-- ============================================================
-- 5. ALTER content_queue — colunas Motor UGC
-- ============================================================
ALTER TABLE content_queue
  ADD COLUMN IF NOT EXISTS engine text DEFAULT 'dark'
    CHECK (engine IN ('dark','ugc')),
  ADD COLUMN IF NOT EXISTS avatar_id uuid
    REFERENCES avatars(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS voice_clone_id uuid
    REFERENCES voice_clones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS social_account_id uuid
    REFERENCES social_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS platform text DEFAULT 'youtube'
    CHECK (platform IN ('youtube','instagram','tiktok')),
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_url text,
  ADD COLUMN IF NOT EXISTS published_platform_id text;

CREATE INDEX IF NOT EXISTS idx_queue_engine
  ON content_queue(user_id, engine, status);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled
  ON content_queue(scheduled_at)
  WHERE status = 'ready' AND scheduled_at IS NOT NULL;

-- ============================================================
-- 6. STORAGE BUCKETS Motor UGC (privados)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatar-training-videos', 'avatar-training-videos', false,
   104857600, ARRAY['video/mp4','video/webm','video/quicktime']),
  ('avatar-training-photos', 'avatar-training-photos', false,
   10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('ugc-videos',             'ugc-videos',             false,
   524288000, ARRAY['video/mp4','video/webm']),
  ('voice-training-audio',   'voice-training-audio',   false,
   52428800,  ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/m4a'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: apenas o dono faz upload/leitura (pasta = auth.uid())
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'avatar_videos_owner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "avatar_videos_owner" ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id = 'avatar-training-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'avatar-training-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'avatar_photos_owner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "avatar_photos_owner" ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id = 'avatar-training-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'avatar-training-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'ugc_videos_owner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "ugc_videos_owner" ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id = 'ugc-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'ugc-videos'
        AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'voice_audio_owner' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "voice_audio_owner" ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id = 'voice-training-audio'
        AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'voice-training-audio'
        AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- ============================================================
-- 7. RLS
-- ============================================================
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars         ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_clones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subscriptions_own' AND tablename = 'subscriptions') THEN
    CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_own' AND tablename = 'avatars') THEN
    CREATE POLICY "avatars_own" ON avatars FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'voice_clones_own' AND tablename = 'voice_clones') THEN
    CREATE POLICY "voice_clones_own" ON voice_clones FOR ALL USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_accounts_own_read' AND tablename = 'social_accounts') THEN
    CREATE POLICY "social_accounts_own_read" ON social_accounts FOR SELECT USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_accounts_own_write' AND tablename = 'social_accounts') THEN
    CREATE POLICY "social_accounts_own_write" ON social_accounts FOR INSERT WITH CHECK (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_accounts_own_update' AND tablename = 'social_accounts') THEN
    CREATE POLICY "social_accounts_own_update" ON social_accounts FOR UPDATE USING (user_id = get_user_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_accounts_own_delete' AND tablename = 'social_accounts') THEN
    CREATE POLICY "social_accounts_own_delete" ON social_accounts FOR DELETE USING (user_id = get_user_id());
  END IF;
END $$;

-- ============================================================
-- 8. TRIGGERS updated_at
-- ============================================================
DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_avatars_updated_at ON avatars;
CREATE TRIGGER trg_avatars_updated_at
  BEFORE UPDATE ON avatars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_voice_clones_updated_at ON voice_clones;
CREATE TRIGGER trg_voice_clones_updated_at
  BEFORE UPDATE ON voice_clones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. FUNÇÃO: gate Motor UGC (usar em API Routes)
-- ============================================================
CREATE OR REPLACE FUNCTION user_can_use_ugc(p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND plan_type IN ('pro','enterprise')
      AND status IN ('active','trial')
      AND (trial_ends_at IS NULL OR trial_ends_at > now())
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- COMENTÁRIOS LGPD
-- ============================================================
COMMENT ON TABLE avatars IS
  'Dados biométricos LGPD Art.11. consent_confirmed = TRUE obrigatório antes de qualquer upload ou treinamento.';
COMMENT ON TABLE voice_clones IS
  'Dados biométricos LGPD Art.11. consent_confirmed = TRUE obrigatório antes de qualquer processamento.';
COMMENT ON COLUMN social_accounts.access_token IS
  'Token OAuth. NUNCA retornar via SELECT do cliente. Usar apenas em API Routes server-side.';
