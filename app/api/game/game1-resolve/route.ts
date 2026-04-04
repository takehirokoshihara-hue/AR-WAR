import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { winner, odds } = await request.json()

    if (!winner || !odds || typeof odds !== 'number') {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('game', 'game1')
      .eq('target', winner)

    if (betsError) {
      return NextResponse.json(
        { error: betsError.message },
        { status: 500 }
      )
    }

    for (const bet of bets || []) {
      const payout = Math.floor(bet.amount * odds)

      const { error: updateError } = await supabase.rpc('increment_ar_balance', {
        team_uuid: bet.team_id,
        increment_amount: payout
      })

      if (updateError) {
        const { data: team } = await supabase
          .from('teams')
          .select('ar_balance')
          .eq('id', bet.team_id)
          .single()

        if (team) {
          await supabase
            .from('teams')
            .update({ ar_balance: team.ar_balance + payout })
            .eq('id', bet.team_id)
        }
      }
    }

    await supabase
      .from('bets')
      .delete()
      .eq('game', 'game1')

    return NextResponse.json({
      success: true,
      winner,
      payouts: bets?.length || 0
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
