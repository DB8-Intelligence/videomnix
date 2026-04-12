-- Videomnix · Migration 003 — Correções P0
-- UNIQUE constraint para upsert em video_metrics
-- Policies RLS faltantes
-- Storage buckets

-- ============================================================
-- 1. UNIQUE constraint em video_metrics.content_id
-- ============================================================
ALTER TABLE video_metrics
  ADD CONSTRAINT video_metrics_content_id_unique UNIQUE (content_id);

-- ============================================================
-- 2. Policies RLS faltantes
-- ============================================================

-- video_metrics: INSERT para API routes autenticadas
CREATE POLICY "metrics_insert" ON video_metrics
  FOR INSERT WITH CHECK (user_id = get_user_id());

-- video_metrics: UPDATE para sync de analytics
CREATE POLICY "metrics_update" ON video_metrics
  FOR UPDATE USING (user_id = get_user_id());

-- data_sources: INSERT
CREATE POLICY "sources_insert" ON data_sources
  FOR INSERT WITH CHECK (channel_id IN (
    SELECT id FROM channels WHERE user_id = get_user_id()
  ));

-- data_sources: UPDATE
CREATE POLICY "sources_update" ON data_sources
  FOR UPDATE USING (channel_id IN (
    SELECT id FROM channels WHERE user_id = get_user_id()
  ));

-- data_sources: DELETE
CREATE POLICY "sources_delete" ON data_sources
  FOR DELETE USING (channel_id IN (
    SELECT id FROM channels WHERE user_id = get_user_id()
  ));

-- ============================================================
-- 3. Storage buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('channel-audio', 'channel-audio', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav']),
  ('channel-videos', 'channel-videos', true, 524288000, ARRAY['video/mp4', 'video/webm']),
  ('channel-shorts', 'channel-shorts', true, 104857600, ARRAY['video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies: upload autenticado, leitura pública
CREATE POLICY "audio_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'channel-audio');

CREATE POLICY "audio_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'channel-audio');

CREATE POLICY "videos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'channel-videos');

CREATE POLICY "videos_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'channel-videos');

CREATE POLICY "shorts_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'channel-shorts');

CREATE POLICY "shorts_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'channel-shorts');
