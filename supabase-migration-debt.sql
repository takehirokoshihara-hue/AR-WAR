-- 借金システムのためのマイグレーション
-- teams テーブルに debt_count カラムを追加

ALTER TABLE teams ADD COLUMN IF NOT EXISTS debt_count INT NOT NULL DEFAULT 0;

-- 既存のチームにもデフォルト値を設定
UPDATE teams SET debt_count = 0 WHERE debt_count IS NULL;
