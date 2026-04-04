import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // リクエストボディのパース
    let team_id: string
    try {
      const body = await request.json()
      team_id = body.team_id
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (!team_id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Loan] Processing loan for team: ${team_id}`)

    // チーム情報を取得
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', team_id)
      .single()

    if (teamError) {
      console.error('[Loan] Team fetch error:', teamError)
      return NextResponse.json(
        {
          error: 'Failed to fetch team',
          message: teamError.message,
          details: teamError.details,
          hint: teamError.hint
        },
        { status: 404 }
      )
    }

    if (!team) {
      console.error('[Loan] Team not found:', team_id)
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    console.log('[Loan] Current team state:', {
      name: team.name,
      ar_balance: team.ar_balance,
      debt_count: team.debt_count
    })

    // debt_countの存在チェック
    if (typeof team.debt_count !== 'number') {
      console.error('[Loan] debt_count column missing or invalid')
      return NextResponse.json(
        {
          error: 'Database schema error',
          message: 'debt_count column is missing or invalid',
          hint: 'Run migration: ALTER TABLE teams ADD COLUMN IF NOT EXISTS debt_count INT NOT NULL DEFAULT 0;',
          current_team_data: team
        },
        { status: 500 }
      )
    }

    // 融資処理
    const newBalance = team.ar_balance + 300000
    const newDebtCount = team.debt_count + 1

    console.log('[Loan] Updating team with:', {
      ar_balance: newBalance,
      debt_count: newDebtCount
    })

    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({
        ar_balance: newBalance,
        debt_count: newDebtCount
      })
      .eq('id', team_id)
      .select()
      .single()

    if (updateError) {
      console.error('[Loan] Update error:', updateError)
      return NextResponse.json(
        {
          error: updateError.message,
          details: updateError.details || 'No details available',
          hint: updateError.hint || 'Check database permissions and schema',
          code: updateError.code
        },
        { status: 500 }
      )
    }

    console.log('[Loan] Loan successful:', {
      team_id,
      new_balance: newBalance,
      debt_count: newDebtCount
    })

    return NextResponse.json({
      success: true,
      new_balance: newBalance,
      debt_count: newDebtCount,
      team_name: team.name
    })
  } catch (error) {
    console.error('[Loan] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
