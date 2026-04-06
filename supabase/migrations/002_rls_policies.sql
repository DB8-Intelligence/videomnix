ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue  ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_metrics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_self" ON users
  USING (auth_id = auth.uid());

CREATE POLICY "users_insert_self" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY "channels_owner" ON channels
  USING (user_id = get_user_id());

CREATE POLICY "channels_insert" ON channels
  FOR INSERT WITH CHECK (user_id = get_user_id());

CREATE POLICY "queue_owner" ON content_queue
  USING (user_id = get_user_id());

CREATE POLICY "queue_insert" ON content_queue
  FOR INSERT WITH CHECK (user_id = get_user_id());

CREATE POLICY "metrics_owner" ON video_metrics
  USING (user_id = get_user_id());

CREATE POLICY "sources_owner" ON data_sources
  USING (channel_id IN (
    SELECT id FROM channels WHERE user_id = get_user_id()
  ));
