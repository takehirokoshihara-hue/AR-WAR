import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * チームのAR残高を直接更新するAPI
 * 管理者が封筒開示後の効果を手動で適用するために使用
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディのパース
    let team_id: string
    let new_balance: number

    try {
      const body = await request.json()
      team_id = body.team_id
      new_balance = body.new_balance
    } catch (parseError) {
      console.error('[UpdateBalance] Failed to parse request body:', parseError)
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

    if (typeof new_balance !== 'number' || new_balance < 0) {
      return NextResponse.json(
        { error: 'Invalid balance (must be non-negative number)' },
        { status: 400 }
      )
    }

    console.log(`[UpdateBalance] Updating team ${team_id} balance to ${new_balance}`)

    // チーム情報を取得
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', team_id)
      .single()

    if (teamError || !team) {
      console.error('[UpdateBalance] Team not found:', teamError)
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    console.log('[UpdateBalance] Current state:', {
      name: team.name,
      old_balance: team.ar_balance,
      new_balance
    })

    // AR残高を更新
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ ar_balance: new_balance })
      .eq('id', team_id)
      .select()
      .single()

    if (updateError) {
      console.error('[UpdateBalance] Update failed:', updateError)
      return NextResponse.json(
        {
          error: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        },
        { status: 500 }
      )
    }

    console.log('[UpdateBalance] Balance updated successfully:', {
      team_id,
      team_name: team.name,
      old_balance: team.ar_balance,
      new_balance
    })

    return NextResponse.json({
      success: true,
      team_id,
      team_name: team.name,
      old_balance: team.ar_balance,
      new_balance,
      change: new_balance - team.ar_balance
    })
  } catch (error) {
    console.error('[UpdateBalance] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
