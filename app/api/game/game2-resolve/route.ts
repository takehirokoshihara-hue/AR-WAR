import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('game', 'game2')

    if (betsError) {
      return NextResponse.json(
        { error: betsError.message },
        { status: 500 }
      )
    }

    if (!bets || bets.length === 0) {
      return NextResponse.json(
        { error: 'No bets found' },
        { status: 400 }
      )
    }

    const choiceA = bets.filter(b => b.target === 'A')
    const choiceB = bets.filter(b => b.target === 'B')

    if (choiceA.length === choiceB.length) {
      for (const bet of bets) {
        const { data: team } = await supabase
          .from('teams')
          .select('ar_balance')
          .eq('id', bet.team_id)
          .single()

        if (team) {
          await supabase
            .from('teams')
            .update({ ar_balance: team.ar_balance + bet.amount })
            .eq('id', bet.team_id)
        }
      }

      await supabase
        .from('bets')
        .delete()
        .eq('game', 'game2')

      return NextResponse.json({
        success: true,
        result: 'draw',
        message: 'Draw - all bets returned'
      })
    }

    const winners = choiceA.length < choiceB.length ? choiceA : choiceB
    const totalPot = bets.reduce((sum, bet) => sum + bet.amount, 0)
    const payoutPerWinner = Math.floor(totalPot / winners.length)

    for (const winner of winners) {
      const { data: team } = await supabase
        .from('teams')
        .select('ar_balance')
        .eq('id', winner.team_id)
        .single()

      if (team) {
        await supabase
          .from('teams')
          .update({ ar_balance: team.ar_balance + payoutPerWinner })
          .eq('id', winner.team_id)
      }
    }

    await supabase
      .from('bets')
      .delete()
      .eq('game', 'game2')

    return NextResponse.json({
      success: true,
      result: 'minority_wins',
      winner_choice: winners[0].target,
      winners: winners.length,
      payout_per_winner: payoutPerWinner
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
