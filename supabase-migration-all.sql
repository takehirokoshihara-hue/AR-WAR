-- ========================================
-- THE AR WARS - 統合マイグレーションSQL
-- ========================================
-- このファイルを Supabase SQL Editor で実行してください
-- 全ての必要なカラムとテーブルが作成されます

-- ========================================
-- 1. 基本テーブルの作成（初回セットアップ時のみ）
-- ========================================

-- チームテーブル (初期資金1,000,000 AR)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  ar_balance BIGINT NOT NULL DEFAULT 1000000,
  debt_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ゲーム状態管理テーブル (常に id=1 の1レコードのみを使用)
CREATE TABLE IF NOT EXISTS game_state (
  id INT PRIMARY KEY DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'lobby',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ends_at TIMESTAMP WITH TIME ZONE
);

-- ベット（賭け）履歴テーブル
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  game TEXT NOT NULL,
  target TEXT NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. 追加カラムのマイグレーション（既存テーブル用）
-- ========================================

-- teams テーブルに debt_count カラムを追加（借金システム）
ALTER TABLE teams ADD COLUMN IF NOT EXISTS debt_count INT NOT NULL DEFAULT 0;

-- 既存チームにデフォルト値を設定
UPDATE teams SET debt_count = 0 WHERE debt_count IS NULL;

-- game_state テーブルに ends_at カラムを追加（カウントダウンタイマー）
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 3. Realtimeの有効化
-- ========================================

-- Supabase Realtime を有効化（既に設定済みの場合はエラーが出ますが問題ありません）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'teams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE teams;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'game_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bets;
  END IF;
END $$;

-- ========================================
-- 4. 初期データの挿入
-- ========================================

-- game_stateに1レコード挿入（まだ存在しない場合のみ）
INSERT INTO game_state (id, phase, metadata, ends_at)
VALUES (1, 'lobby', '{}'::jsonb, NULL)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. 確認クエリ
-- ========================================

-- テーブル構造の確認
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('teams', 'game_state', 'bets')
ORDER BY table_name, ordinal_position;

-- 現在のデータ確認
SELECT 'Teams Count:' as info, COUNT(*)::TEXT as value FROM teams
UNION ALL
SELECT 'Game State:', phase FROM game_state WHERE id = 1
UNION ALL
SELECT 'Bets Count:', COUNT(*)::TEXT FROM bets;

-- ========================================
-- マイグレーション完了
-- ========================================
-- 上記のSQLが全て成功すれば、THE AR WARSの全機能が使用可能です
