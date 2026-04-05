import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Supabase接続テスト用API
 */
export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment_variables: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
        supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET'
      },
      tests: {}
    }

    // テスト1: game_stateテーブルにアクセス
    try {
      const { data: gameState, error: gameStateError } = await supabase
        .from('game_state')
        .select('*')
        .eq('id', 1)
        .single()

      diagnostics.tests.game_state = {
        success: !gameStateError,
        error: gameStateError?.message || null,
        data: gameState || null
      }
    } catch (err) {
      diagnostics.tests.game_state = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // テスト2: teamsテーブルにアクセス
    try {
      const { data: teams, error: teamsError, count } = await supabase
        .from('teams')
        .select('*', { count: 'exact' })

      diagnostics.tests.teams = {
        success: !teamsError,
        error: teamsError?.message || null,
        count: count || 0,
        sample: teams?.slice(0, 2) || []
      }
    } catch (err) {
      diagnostics.tests.teams = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // テスト3: 簡単なINSERTテスト
    try {
      const testTeamName = `test-${Date.now()}`
      const { data: insertData, error: insertError } = await supabase
        .from('teams')
        .insert([{ name: testTeamName }])
        .select()

      if (!insertError && insertData) {
        // 挿入成功したらすぐ削除
        await supabase.from('teams').delete().eq('name', testTeamName)
        diagnostics.tests.insert = {
          success: true,
          message: 'Insert and delete test passed'
        }
      } else {
        diagnostics.tests.insert = {
          success: false,
          error: insertError?.message || 'Unknown error'
        }
      }
    } catch (err) {
      diagnostics.tests.insert = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // 全体の成功判定
    const allTestsPassed = Object.values(diagnostics.tests).every(
      (test: any) => test.success
    )

    return NextResponse.json({
      status: allTestsPassed ? 'OK' : 'FAILED',
      diagnostics
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
