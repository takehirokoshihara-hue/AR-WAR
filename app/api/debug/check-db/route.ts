import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * デバッグ用API: DBの状態をチェック
 * GET /api/debug/check-db
 */
export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // 1. teams テーブルの構造確認
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1)

    results.checks.teams = {
      accessible: !teamsError,
      error: teamsError?.message || null,
      sample_columns: teamsData?.[0] ? Object.keys(teamsData[0]) : [],
      has_debt_count: teamsData?.[0] ? 'debt_count' in teamsData[0] : false
    }

    // 2. game_state テーブルの構造確認
    const { data: gameStateData, error: gameStateError } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    results.checks.game_state = {
      accessible: !gameStateError,
      error: gameStateError?.message || null,
      sample_columns: gameStateData ? Object.keys(gameStateData) : [],
      has_ends_at: gameStateData ? 'ends_at' in gameStateData : false,
      current_phase: gameStateData?.phase || null,
      current_ends_at: gameStateData?.ends_at || null
    }

    // 3. 全体の健全性チェック
    results.health = {
      all_tables_accessible: !teamsError && !gameStateError,
      debt_count_exists: results.checks.teams.has_debt_count,
      ends_at_exists: results.checks.game_state.has_ends_at,
      ready_for_production:
        !teamsError &&
        !gameStateError &&
        results.checks.teams.has_debt_count &&
        results.checks.game_state.has_ends_at
    }

    // 4. 推奨アクション
    results.recommendations = []

    if (!results.checks.teams.has_debt_count) {
      results.recommendations.push({
        issue: 'Missing debt_count column in teams table',
        action: 'Run: ALTER TABLE teams ADD COLUMN IF NOT EXISTS debt_count INT NOT NULL DEFAULT 0;'
      })
    }

    if (!results.checks.game_state.has_ends_at) {
      results.recommendations.push({
        issue: 'Missing ends_at column in game_state table',
        action: 'Run: ALTER TABLE game_state ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;'
      })
    }

    if (results.recommendations.length === 0) {
      results.recommendations.push({
        status: 'All checks passed',
        message: 'Database is properly configured'
      })
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check database',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
