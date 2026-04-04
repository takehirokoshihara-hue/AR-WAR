-- THE AR WARS 機能強化マイグレーション

-- 1. game_state に ends_at カラムを追加（カウントダウンタイマー用）
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

-- 2. game_state の metadata に sound_event を追加する想定
-- （metadata は JSONB なのでカラム追加は不要。アプリ側で sound_event キーを使用）

-- 確認用クエリ
SELECT * FROM game_state;
