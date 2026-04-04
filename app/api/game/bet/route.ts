import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MIN_BET_GAME1 = 100000 // Game 1の最低ベット額: 10万AR

export async function POST(request: NextRequest) {
  try {
    const { team_id, game, target, amount } = await request.json()

    if (!team_id || !game || !target || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Game 1の最低ベット額チェック
    if (game === 'game1' && amount < MIN_BET_GAME1) {
      return NextResponse.json(
        { error: `Game 1 requires minimum bet of ${MIN_BET_GAME1} AR` },
        { status: 400 }
      )
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('ar_balance')
      .eq('id', team_id)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    if (team.ar_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('teams')
      .update({ ar_balance: team.ar_balance - amount })
      .eq('id', team_id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert([{ team_id, game, target, amount }])
      .select()
      .single()

    if (betError) {
      await supabase
        .from('teams')
        .update({ ar_balance: team.ar_balance })
        .eq('id', team_id)

      return NextResponse.json(
        { error: betError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, bet })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
